//====================
// Sistema de Alarmes - gerenciamento de efeitos sustentados, sincronia, lembretes e reações a eventos de combate
//====================

console.log("I Choose Roll! [Sistema de Alarmes] 1.0.9 carregado");

//====================
// Bloco 0 - Constantes do Projeto
//====================
const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle; margin-right:8px;">`;
const CMacros = "i-choose-roll.i-choose-macros";
const NCMacros = "I Choose Macros!";
const prefixo = "I Choose Roll! [Sistema de Alarmes]";
const mNome = "I Choose Roll!";
const mID = "i-choose-roll";
const CS = "i-choose-roll.choose-roll-system-bindings";
const NCSistema = "I Choose Roll! [Arquivos de Sistema]";
const TPR = (CONFIG.time.roundTime && CONFIG.time.roundTime > 0) ? CONFIG.time.roundTime : 6; // Tempo por round (segundos)
const BP = 'processadoNoRound'; // Flag que marca ator atualizado no round
// LOG de início da macro
console.log(`${prefixo} Macro acionada automaticamente.`);

// Converte a duração de um efeito para rounds, respeitando a unidade declarada.
function converterParaRounds(valor = 0, unidade = "rounds") {
	console.log(`${prefixo} Convertendo valores para round.`);
    switch (unidade) {
        case "minutes": return valor * 10;
        case "hours": return valor * 600;
        case "days": return valor * 14400;
        case "years": return valor * 5256000;
        default: return valor; // rounds ou unlimited permanecem
    }
}

//====================
// Bloco 1 - Definição do Combatente Atual com persistência controlada
//====================

// Variáveis globais para identificar o combatente atual de forma única
let combatenteAtual = null;        // Referência direta ao ator
let tokenCombatenteId = null;      // ID do token ativo no turno

// Inicializa o combatente atual imediatamente se houver combate já ativo
if (game.combat?.started && game.combat.combatant?.token) {
	const token = game.combat.combatant.token;
	combatenteAtual = token.actor;
	tokenCombatenteId = token.id;
	console.log(`${prefixo} Combatente atual definido no carregamento: ${combatenteAtual.name} [Token: ${tokenCombatenteId}]`);
}

// Atualiza sempre que o turno começar
Hooks.on("pf2e.startTurn", async (combatente) => {
	if (!game.combat || !game.combat.started) {
		console.warn(`${prefixo} Nenhum combate ativo!`);
		return;
	}
	
	const token = game.combat.combatant?.token;
	const ator = token?.actor;
	
	if (!token || !ator) {
		console.warn(`${prefixo} Nenhum token ou ator válido no turno atual.`);
		return;
	}
	
	combatenteAtual = ator;
	tokenCombatenteId = token.id;
	
	console.log(`${prefixo} Combatente atual atualizado: ${combatenteAtual.name} [Token: ${tokenCombatenteId}]`);
});
	
//====================
// Bloco 2 - Conversão de worldTime para round + cálculo da duração restante
// Corrige efeitos cujo valor system.start.value foi salvo como worldTime e calcula duração restante no início de cada turno e round
//====================

// Corrige efeitos com worldTime → round
async function converterInicioComoRound(efeito) {
	if (!efeito || efeito.type !== "effect") return;
	if (!efeito.actor) return;
	if (!combatenteAtual) {
		console.warn(`${prefixo} Nenhum combatente atual definido — ignorando conversão.`);
		return;
	}
	
	const inicioBruto = efeito.system?.start?.value;
	const worldTimeAtual = game.time.worldTime;
	
	const duracao = converterParaRounds(
	 efeito.system?.duration?.value ?? 0,
     efeito.system?.duration?.unit ?? "rounds"
	);

	
	const delta = worldTimeAtual - inicioBruto;
	const roundsPassados = Math.floor(delta / TPR);
	const restantes = duracao - roundsPassados;
	
	console.log(`${prefixo} ${efeito.name} — início: ${inicioBruto}, duração (em rounds): ${duracao}, worldTimeAtual: ${worldTimeAtual}, delta: ${delta}, roundsPassados: ${roundsPassados}, restantes: ${restantes}`);
	
	// opcional: salvar para auditoria
	await efeito.setFlag("i-choose-roll", "duracaoRestante", restantes);
}

//====================
// Bloco 3 - Cálculo da duração restante para efeitos com duração limitada
//====================

async function calcularDuracaoRestante(ator, quando) {
	if (!game.user.isGM) return;
	
	const roundAtual = game.combat?.round ?? 0;
	const worldTimeAtual = game.time.worldTime;
	
	for (const efeito of ator.itemTypes.effect) {
		const start = efeito.system?.start?.value ?? 0;
		const duracao = converterParaRounds(
		 efeito.system?.duration?.value ?? 0,
		 efeito.system?.duration?.unit ?? "rounds"
		);

		
		if (duracao <= 0) {
			console.log(`${prefixo} Ignorado efeito sem duração limitada: ${efeito.name}`);
			continue;
		}
		
		let roundsPassados = 0;
		let restante = 0;
		
		if (start >= 1 && start <= 99) {
			
			// Se start é em rounds
			roundsPassados = roundAtual - start;
			restante = duracao - roundsPassados;
			console.log(`${prefixo} ${efeito.name} — cálculo com roundAtual: start=${start}, roundAtual=${roundAtual}, duracao=${duracao}, passados=${roundsPassados}, restantes=${restante}`);
			
		} else {
			
			// Caso contrário, calcula com worldTime
			const deltaSegundos = worldTimeAtual - start;
			roundsPassados = Math.floor(deltaSegundos / TPR);
			restante = duracao - roundsPassados;
			console.log(`${prefixo} ${efeito.name} — cálculo com worldTime: start=${start}, worldTimeAtual=${worldTimeAtual}, duracao=${duracao}, passados=${roundsPassados}, restantes=${restante}`);
		}
		
		await efeito.setFlag("i-choose-roll", "duracaoRestante", restante);
		console.log(`${prefixo} Flag de duração restante gravada para ${efeito.name}: ${restante}`);
	}
}

//====================
// Hooks para recalcular duração no momento correto
//====================

// Hooks de turno — apenas o ator do turno
Hooks.on("pf2e.startTurn", async (combatente) => {
	if (!game.user.isGM) return;
	const ator = combatente.token?.actor;
	if (!ator) return;
	await calcularDuracaoRestante(ator, "começo de turno");
	console.log(`${prefixo} Hook de começo de turno- recálculo.`);
});

Hooks.on("pf2e.endTurn", async (combatente) => {
	if (!game.user.isGM) return;
	const ator = combatente.token?.actor;
	if (!ator) return;
	await calcularDuracaoRestante(ator, "fim de turno");
	console.log(`${prefixo} Hook de fim de turno- recálculo.`);
});

Hooks.on("ichooseroll.retornoturno", async (combat, turnoAnterior, turnoNovo) => {
	if (!game.user.isGM) return;
	const combatentes = combat.combatants;
	const atorAnterior = combatentes[turnoAnterior]?.actor;
	const atorNovo = combatentes[turnoNovo]?.actor;
	if (atorAnterior) await calcularDuracaoRestante(atorAnterior, "retrocesso de turno (anterior)");
	if (atorNovo) await calcularDuracaoRestante(atorNovo, "retrocesso de turno (novo)");
	console.log(`${prefixo} Hook de retorno de turno- recálculo.`);
});

// Hooks de round — todos os atores
Hooks.on("ichooseroll.avancoroundmanual", async (combat, roundAnterior, roundAtual) => {
	if (!game.user.isGM) return;
	const atores = combat.combatants.map(c => c.actor).filter(Boolean);
	for (const ator of atores) {
		await calcularDuracaoRestante(ator, "avanço manual de round");
	}
	
	console.log(`${prefixo} Hook de avanço de round (manual)- recálculo.`);
});

Hooks.on("ichooseroll.retornoroundmanual", async (combat, roundAnterior, roundAtual) => {
	if (!game.user.isGM) return;
	const atores = combat.combatants.map(c => c.actor).filter(Boolean);
	for (const ator of atores) {
		await calcularDuracaoRestante(ator, "retrocesso manual de round");
	}
	
	console.log(`${prefixo} Hook de começo de turno- recálculo.`);
});

//====================
// Bloco 4 - Início do turno: exibição de botões de Sustentar, Dissipar e Sincronizar
//====================

Hooks.on("pf2e.startTurn", async (combatente) => {
	const token = combatente.token;
	const ator = token?.actor;
	
	if (!token || !ator) {
		console.warn(`${prefixo} Combatente atual não possui token ou ator válido — ignorando.`);
		return;
	}
	
	console.log(`${prefixo} Ator identificado: ${ator.name}`);
	
	if (!token?.isOwner) {
		console.warn(`${prefixo} Usuário atual não tem permissão de dono sobre ${ator.name}`);
		return;
	}
	
	console.log(`${prefixo} Permissão confirmada — verificando efeitos sustentados.`);
	const efeitosSustentados = ator.itemTypes.effect.filter(e => e.system?.duration?.sustained === true);
	console.log(`${prefixo} ${efeitosSustentados.length} efeito(s) sustentado(s) detectado(s).`);
	
	for (const efeito of efeitosSustentados) {
		const idEfeito = efeito.id;
		const duracao = efeito.system?.duration?.value ?? -1;
		const regras = efeito.system?.rules ?? [];
		const badge = efeito.system?.badge ?? {};
		const jaSincronizado = regras.some(r => r.key === "RollOption" && r.option === "sincronizado");
		const podeSincronizar =
		  duracao >= 1 &&
		  duracao <= 20 &&
		  !jaSincronizado &&
		  (!badge?.type && typeof badge?.value !== "number");
		
		let htmlMensagem = `
		  <div class="chat-card" data-effect-id="${idEfeito}">
		  <img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;"><strong>${efeito.name}</strong><br><br>
		  Gastar uma ação para sustentar o efeito?<br><br>
		  <button data-acao="sustentar" data-efeito="${idEfeito}" data-token="${token.id}" data-nome="${efeito.name}">✔️ Sustentar</button>
		  <button data-acao="dissipar" data-efeito="${idEfeito}" data-token="${token.id}" data-nome="${efeito.name}">❌ Dissipar</button>`;
		
		if (podeSincronizar) {
			htmlMensagem += `
			<br><br>
			<button data-acao="sincronizar" data-efeito="${idEfeito}" data-token="${token.id}" data-nome="${efeito.name}">⏳ Sincronizar</button>`;
		}

		htmlMensagem += `</div>`;
		
		//  Toda mensagem será criada exclusivamente pelo GM
		if (!game.user.isGM) return;
		
		console.log(`${prefixo} Criando mensagem como GM: ${efeito.name}`)
		const temPlayer = ator.hasPlayerOwner;
		const whisper = temPlayer ? undefined : ChatMessage.getWhisperRecipients("GM").map(u => u.id);
		
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ token }),
			content: htmlMensagem,
			style: CONST.CHAT_MESSAGE_STYLES.OTHER,
			whisper
		});
	}
});

//====================
// Bloco 5 - Ativação dos botões interativos renderizados no chat
//====================

Hooks.on("renderChatMessage", (msg, html) => {
	console.log(`${prefixo} renderChatMessage executado para mensagem ${msg.id} | Usuário: ${game.user.name}`);
	
	// Verifica se a mensagem contém um ID de efeito associado
	const idMensagem = html.find(".chat-card").data("effect-id");
	if (!idMensagem) {
		console.warn(`${prefixo} renderChatMessage ignorado — mensagem sem data-effect-id`);
		return;
	}
	
	console.log(`${prefixo} Iniciando ativação de botões para efeito ${idMensagem}`);
	
	// Ativador dos botões interativos
	html.on("click", "button[data-acao]", async (evento) => {
		const botao = evento.currentTarget;
		const { acao, token: idToken, efeito: idEfeito, nome: nomeEfeito } = botao.dataset;
		
		console.log(`${prefixo} Botão clicado — ação: ${acao} | efeito: ${nomeEfeito} | token: ${idToken}`);
		
		// Recupera token e ator a partir do ID
		const token = canvas.tokens.get(idToken);
		
		if (!token) {
			console.warn(`${prefixo} Token não encontrado no canvas: ${idToken}`);
			return;
		}
		
		const ator = token.actor;
		
		if (!ator) {
			console.warn(`${prefixo} Token sem ator associado: ${idToken}`);
			return;
		}
		
		// Verifica permissão real de dono
		const permissao = ator.testUserPermission(game.user, "OWNER");
		console.log(`${prefixo} Permissão do usuário sobre ${ator.name}: ${permissao}`);
		
		if (!permissao) {
			console.warn(`${prefixo} Usuário ${game.user.name} não tem permissão para ${nomeEfeito}`);
			ui.notifications.warn(`${logo} Você não tem permissão para interagir com esse efeito.`);
			return;
		}
		
		// Recupera o efeito pelo ID
		const efeito = ator.itemTypes.effect.find(e => e.id === idEfeito);
		
		if (!efeito) {
			console.warn(`${prefixo} Efeito ${idEfeito} não encontrado no ator ${ator.name}`);
			return;
		}
		
		//====================
		// Botão: Sustentar
		//====================
		if (acao === "sustentar") {
			console.log(`${prefixo} Ação: Sustentar — ${nomeEfeito}`);
			// Remove flag de dissipar (se houver)
			await efeito.unsetFlag("i-choose-roll", "dissiparFimTurno");
			// Seta flag de sustentar
			await efeito.setFlag("i-choose-roll", "sustentarTurnoAtual", true);
			
			const restante = efeito.getFlag("i-choose-roll", "duracaoRestante") 
			?? efeito.system?.duration?.value 
			?? "-";

			await ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ actor: ator }),
				content: `
				<div class="chat-card">
				 <img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;">
				 <strong>${nomeEfeito}</strong><br><br>
				 <em>Será sustentado neste turno. Restam ${restante} round(s).</em>
				</div>`
			});
		}
		
		//====================
		// Botão: Dissipar
		//====================
		if (acao === "dissipar") {
			console.log(`${prefixo} Ação: Dissipar — ${nomeEfeito}`);
			// Remove flag de sustentar (se houver)
			await efeito.unsetFlag("i-choose-roll", "sustentarTurnoAtual");
			// Seta flag de dissipar
			await efeito.setFlag("i-choose-roll", "dissiparFimTurno", true);
			
			await ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ actor: ator }),
				content: `
				<div class="chat-card">
				 <img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;">
				 <strong>${nomeEfeito}</strong><br><br>
				 <em>Será dissipado ao final deste turno.</em>
				</div>`
			});
		}
		
		//====================
		// Botão: Sincronizar
		//====================
		if (acao === "sincronizar") {
			console.log(`${prefixo} Clique em botão de sincronia para ${nomeEfeito}`);
			await sincronizarEfeitoSistemaAlarmes({ token, ator, efeito });
		}
	});
});


//====================
//Bloco 6 - Fim do turno: dissipação de efeitos marcados
// Executa no fim do turno do ator. Exibe descrições de alarmeFimTurno e remove efeitos marcados com dissiparFimTurno.
//====================

Hooks.on("pf2e.endTurn", async (combatente) => {
	if (!game.user.isGM) return;

	const token = combatente.token;
	const ator = token?.actor;
	
	if (!token || !ator) {
		console.warn(`${prefixo} Combatente sem token ou ator válido — ignorado.`);
		return;
	}
	
	console.log(`${prefixo} Fim do turno de ${ator.name} — iniciando verificação de efeitos.`);
	
	// Verifica e exibe descrições alarmeFimTurno
	const efeitosComTeste = ator.itemTypes.effect.filter(efeito =>
	 efeito.system?.rules?.some(regra => regra.key === "RollOption" && regra.option === "alarmeFimTurno")
	);
	
	for (const efeito of efeitosComTeste) {
		console.log(`${prefixo} Exibindo descrição alarmeFimTurno para: ${efeito.name}`);
		
		const descricao = await TextEditor.enrichHTML(efeito.system.description.value || "", {
			async: true,
			rollData: ator.getRollData(),
			secrets: false
		});
		
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ token }),
			content: `<div class="chat-card">${logo}<strong>${efeito.name}</strong><br>${descricao}</div>`
		});
	}
	
	// Remove efeitos marcados com dissiparFimTurno
	const efeitosParaRemover = ator.itemTypes.effect.filter(e => e.getFlag("i-choose-roll", "dissiparFimTurno"));
	
	for (const efeito of efeitosParaRemover) {
		console.log(`${prefixo} Removendo efeito marcado: ${efeito.name}`);
		await efeito.delete();
		ui.notifications.info(`${logo} <strong>${efeito.name}</strong> não foi sustentado.`);
	}
});

//====================
// Bloco 7 - Alarme de entrada: efeitos com RollOption alarmeEntrada
// Dispara automaticamente quando um efeito com alarmeEntrada é aplicado ao ator em turno ativo.
//====================

Hooks.on("createItem", async (item) => {
	if (!game.user.isGM) return;
	if (item.type !== "effect") return;
	if (!item.actor) return;
	
	// Verifica se o efeito contém a regra de "alarmeEntrada"
	const temAlarmeEntrada = item.system?.rules?.some(regra =>
	 regra.key === "RollOption" && regra.option === "alarmeEntrada"
	);
	
	if (!temAlarmeEntrada) return;
	
	if (!tokenCombatenteId) {
		console.log(`${prefixo} Ignorado — combatente atual ainda não definido.`);
		return;
	}
	
	const tokenDoEfeito = item.actor.getActiveTokens(true, true)[0];
	
	if (!tokenDoEfeito || tokenDoEfeito.id !== tokenCombatenteId) {
		console.log(`${prefixo} Ignorado — efeito criado para token fora do turno atual.`);
		return;
	}
	
	const temAlarmeDesativado = item.system?.rules?.some(r => r.key === "RollOption" && r.option === "alarmeDesativado");
	
	if (temAlarmeDesativado) {
		console.log(`${prefixo} Alarme desativado para: ${item.name}`);
		return;
	}
	
	console.log(`${prefixo} Alarme de entrada detectado para: ${item.name}`);
	await exibirMensagemDeAlarme({ token: tokenDoEfeito, efeito: item });
});

//====================
//Bloco 8 - Alarme de começo de turno: efeitos com RollOption alarmeComecoTurno
// Dispara automaticamente no início do turno do ator, se houver efeito com alarmeComecoTurno.
//====================

Hooks.on("pf2e.startTurn", async (combatente) => {
	if (!game.user.isGM) return;
	const token = combatente.token;
	const ator = token?.actor;
	
	if (!token || !ator) {
		console.warn(`${prefixo} Alarme de começo de turno — combatente inválido.`);
		return;
	}
	
	console.log(`${prefixo} Início do turno de ${ator.name} — verificando efeitos com alarmeComecoTurno.`);
	
	const efeitosComAlarme = ator.itemTypes.effect.filter(efeito =>
	 efeito.system?.rules?.some(regra =>
         regra.key === "RollOption" && regra.option === "alarmeComecoTurno"
	    )
	);
	
	for (const efeito of efeitosComAlarme) {
		const temAlarmeDesativado = efeito.system?.rules?.some(r => r.key === "RollOption" && r.option === "alarmeDesativado");
		if (temAlarmeDesativado) {
			console.log(`${prefixo} Alarme desativado para: ${efeito.name}`);
			continue;
		}
		
		console.log(`${prefixo} Alarme de começo de turno ativado: ${efeito.name}`);
		await exibirMensagemDeAlarme({ token, efeito });
	}
});

//====================
//Bloco 9 - Alarme de fim de turno: efeitos com RollOption alarmeFimTurno
// Dispara automaticamente ao fim do turno do ator, se houver efeito com alarmeFimTurno.
//====================

Hooks.on("pf2e.endTurn", async (combatente) => {
	if (!game.user.isGM) return;
	const token = combatente.token;
	const ator = token?.actor;
	
	if (!token || !ator) {
		console.warn(`${prefixo} Alarme de fim de turno — combatente inválido.`);
		return;
	}
	
	console.log(`${prefixo} Fim do turno de ${ator.name} — verificando efeitos com alarmeFimTurno.`);
	
	const efeitosComAlarme = ator.itemTypes.effect.filter(efeito =>
	 efeito.system?.rules?.some(regra =>
	     regra.key === "RollOption" && regra.option === "alarmeFimTurno"
		)
	);
	
	for (const efeito of efeitosComAlarme) {
		const temAlarmeDesativado = efeito.system?.rules?.some(r => r.key === "RollOption" && r.option === "alarmeDesativado");
		if (temAlarmeDesativado) {
			console.log(`${prefixo} Alarme desativado para: ${efeito.name}`);
			continue;
		}
		
		console.log(`${prefixo} Alarme de fim de turno ativado: ${efeito.name}`);
		await exibirMensagemDeAlarme({ token, efeito });
	}
});

//====================
//Bloco 10 - Alarme de saída (armazenar): efeitos com RollOption alarmeSaida
// Ao criar o efeito, salva a mensagem renderizada como flag no ator.
//====================

Hooks.on("createItem", async (efeito) => {
	if (!game.user.isGM) return;
	if (efeito.type !== "effect") return;
	if (!efeito.actor) return;
	
	const temAlarmeSaida = efeito.system?.rules?.some(regra =>
	 regra.key === "RollOption" && regra.option === "alarmeSaida"
	);
	
	if (!temAlarmeSaida) return;
	const token = efeito.actor.getActiveTokens(true, true)[0];
	
	if (!token) {
		console.warn(`${prefixo} Alarme de saída — token não encontrado para ${efeito.actor.name}`);
		return;
	}
	
	const descricao = await TextEditor.enrichHTML(efeito.system.description.value || "", {
		async: true,
		rollData: efeito.actor.getRollData(),
		secrets: false
	});
	
	const somenteGM = efeito.system?.unidentified === true;
	const mensagem = {
		nome: efeito.name,
		html: descricao,
		apenasGM: somenteGM
	};
	
	await efeito.actor.setFlag("i-choose-roll", `alarmeSaida.${efeito.id}`, mensagem);
	console.log(`${prefixo} Alarme de saída armazenado para ${efeito.name}`);
});

//====================
//Bloco 11 - Alarme de saída (disparo): quando o efeito for removido
// Recupera a mensagem salva no ator e exibe no chat. Em seguida, apaga a flag.
//====================

Hooks.on("deleteItem", async (efeito) => {
	if (!game.user.isGM) return;
	if (efeito.type !== "effect") return;
	if (!efeito.actor) return;
	const dados = efeito.actor.getFlag("i-choose-roll", `alarmeSaida.${efeito.id}`);
	
	if (!dados) return;
	const token = efeito.actor.getActiveTokens(true, true)[0];
	
	if (!token) {
		console.warn(`${prefixo} Alarme de saída — token não encontrado para exibir mensagem de ${efeito.name}`);
		return;
	}
	
	const temAlarmeDesativado = efeito.system?.rules?.some(r => r.key === "RollOption" && r.option === "alarmeDesativado");
	
	if (temAlarmeDesativado) {
		console.log(`${prefixo} Alarme desativado para: ${efeito.name}`);
		return;
	}
	
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ token }),
		content: `<div class="chat-card">${logo}<strong>${dados.nome}</strong><br>${dados.html}</div>`,
		whisper: dados.apenasGM ? ChatMessage.getWhisperRecipients("GM").map(u => u.id) : undefined
	});
	
	await efeito.actor.unsetFlag("i-choose-roll", `alarmeSaida.${efeito.id}`);
	console.log(`${prefixo} Alarme de saída exibido e limpo para ${dados.nome}`);
});

//====================
//Bloco 12 - Função utilitária para exibir mensagens de alarme
// Centraliza a lógica de exibição, suporta tanto objetos de efeito quanto HTML pré-renderizado.
//====================

async function exibirMensagemDeAlarme({ token, efeito = null, html = null, nome = null, apenasGM = null }) {
	
	if (!token) {
		console.warn(`${prefixo} Função de alarme chamada sem token válido.`);
		return;
	}
	
	// Caminho 1: efeito completo foi fornecido
	if (efeito) {
		const secreto = efeito.system?.unidentified === true;
		const descricao = efeito.system.description.value || "";
		
		const descricaoRenderizada = await TextEditor.enrichHTML(descricao, {
			async: true,
			rollData: efeito.actor.getRollData(),
			secrets: false
		});
		
		if (!secreto) {
			// Caso não seja secreto: envia a mensagem completa
			console.log(`${prefixo} Exibindo alarme público com botão de sistema: ${efeito.name}`);
			
			await efeito.toMessage({
				create: true,
				speaker: ChatMessage.getSpeaker({ token })
			});
		} else {
			// Secreto: envia whisper com a descrição completa para o GM
			console.log(`${prefixo} Exibindo descrição secreta (whisper) para: ${efeito.name}`);
			
			await ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ token }),
				content: `<div class="chat-card"><img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;">
				<strong>${efeito.name}</strong><br><br>${descricaoRenderizada}</div>`,
				whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id)
			});
			
			// Depois: envia somente os @Check[…] em público (se houver)
			console.log(`${prefixo} Exibindo apenas @Check[…] em público para: ${efeito.name}`);
			const testes = [...descricao.matchAll(/@Check\[.*?\]/g)].map(m => m[0]);
			
			if (testes.length > 0) {
				const conteudo = testes.join("<br>");
				await ChatMessage.create({
					speaker: ChatMessage.getSpeaker({ token }),
					content: `
					<div class="chat-card">
					 <img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;">
					 <strong>${efeito.name}</strong><br><br>
					 ${conteudo}
					</div>`
				});
			} else {
				console.log(`${prefixo} Nenhum @Check[…] encontrado, não enviando mensagem pública extra para: ${efeito.name}`);
			}
		}
		return;
	}
	
	// Caminho 2: modo alternativo com HTML já renderizado (ex: alarme de saída)
	if (html) {
		const somenteGM = apenasGM === true;
		const nomeFinal = nome ?? "Alarme";
		console.log(`${prefixo} Exibindo mensagem de alarme manual: ${nomeFinal}`);
		
		await ChatMessage.create({
			speaker: ChatMessage.getSpeaker({ token }),
			content: `<div class="chat-card">${logo}<strong>${nomeFinal}</strong><br>${html}</div>`,
			whisper: somenteGM ? ChatMessage.getWhisperRecipients("GM").map(u => u.id) : undefined
		});
	}
}

//====================
// Bloco 13 - Sincronizar efeito com badge e marcar como sincronizado
//====================

async function sincronizarEfeitoSistemaAlarmes({ token, ator, efeito }) {
	console.log(`${prefixo} Iniciando sincronia do efeito: ${efeito.name}`);
	
	if (!token || !ator || !efeito) {
		console.warn(`${prefixo} Dados inválidos para sincronia.`);
		return;
	}
	
	// Etapa 1: Cria badge inicial com valor 1
	const badgeInicial = {
		type: "counter",
		value: 1
	};
	
	await efeito.update({ "system.badge": badgeInicial });
	console.log(`${prefixo} Badge inicial criada para ${efeito.name} com valor 1.`);
	
	// Etapa 2: Atualiza badge com a duração restante
	const duracaoRestanteFlag = efeito.getFlag("i-choose-roll", "duracaoRestante");
	const duracaoRestante = (duracaoRestanteFlag > 0) ? duracaoRestanteFlag : 1;
	
	await efeito.update({ "system.badge.value": duracaoRestante });
	console.log(`${prefixo} Badge atualizada com duração restante: ${duracaoRestante} para ${efeito.name}.`);
	
	// Etapa 3: Marca como sincronizado nas rules
	const regras = foundry.utils.duplicate(efeito.system.rules ?? []);
	regras.push({
		key: "RollOption",
		domain: "self",
		option: "sincronizado"
	});
	
	await efeito.update({ "system.rules": regras });
	console.log(`${prefixo} RollOption 'sincronizado' adicionada a ${efeito.name}.`);

	// Etapa 4: Envia mensagem de confirmação no chat
	const htmlMensagem = `
	<div class="chat-card">
	 <img src="${efeito.img}" width="32" height="32" style="vertical-align:middle; margin-right:8px;">
	 <strong>${efeito.name}</strong><br>
	 <em>Sincronizado com duração restante: ${duracaoRestante} round(s).</em>
	</div>`;
	
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ token }),
		content: htmlMensagem,
		whisper: undefined
	});
	
	console.log(`${prefixo} Mensagem de sincronia enviada para ${efeito.name}.`);
}
//====================
// Hook: pf2e.endTurn — Sincronizar efeitos marcados com RollOption: sincronizado
//====================
Hooks.on("pf2e.endTurn", async (combatente) => {
  try {
    // Apenas o GM executa esta lógica
    if (!game.user.isGM) return;

    const token = combatente.token;
    const ator = token?.actor;

    if (!token || !ator) {
      console.warn(`${prefixo} [Sincronia endTurn] Combatente inválido — sem token ou ator.`);
      return;
    }

    console.log(`${prefixo} [Sincronia endTurn] Iniciando verificação dos efeitos sincronizados para: ${ator.name} [Token: ${token.id}]`);

    // Itera por todos os efeitos do ator
    for (const efeito of ator.itemTypes.effect) {

      const regras = efeito.system?.rules ?? [];
      const badge = efeito.system?.badge;

      // Verifica se o efeito tem a RollOption 'sincronizado'
      const temSincronizado = regras.some(r => r.key === "RollOption" && r.option === "sincronizado");

      if (!temSincronizado) {
        console.log(`${prefixo} [Sincronia endTurn] Ignorado — ${efeito.name} não está marcado como sincronizado.`);
        continue;
      }

      if (!badge || typeof badge.value !== "number") {
        console.log(`${prefixo} [Sincronia endTurn] Ignorado — ${efeito.name} não tem badge numérica.`);
        continue;
      }

      console.log(`${prefixo} [Sincronia endTurn] Processando efeito sincronizado: ${efeito.name} | Badge atual: ${badge.value}`);

      // Se badge > 1, reduz em 1
      if (badge.value > 1) {
        const novoValor = badge.value - 1;
        await efeito.update({ "system.badge.value": novoValor });
        console.log(`${prefixo} [Sincronia endTurn] Badge de ${efeito.name} reduzida: ${badge.value} → ${novoValor}`);
      }
      // Se badge == 1, remove completamente
      else if (badge.value === 1) {
        await efeito.update({ "system.badge": null });
        console.log(`${prefixo} [Sincronia endTurn] Badge de ${efeito.name} removida pois estava em 1.`);
      }
    }

    console.log(`${prefixo} [Sincronia endTurn] Verificação concluída para: ${ator.name}`);
  } catch (e) {
    console.error(`${prefixo} [Sincronia endTurn] Erro ao processar efeitos sincronizados:`, e);
  }
});
