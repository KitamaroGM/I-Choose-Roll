//====================
// ArbritoDeCombate — Bloco 0: Inicialização de variáveis e constantes
//====================

// Log de rastreio: carregamento do ArbritoDeCombate
console.log(`I Choose Roll! [Arbrito De Combate] 1.0.8 carregado — inicializando variáveis e constantes`);

const prefixo = `I Choose Roll! [Árbitro de Combate]`;
const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle; margin-right:8px;">`;
const mID = "i-choose-roll";
const BP = 'processadoNoRound'; // Flag que marca ator atualizado no round

// Objeto global para armazenar o estado atual do combate

const estadoCombate = {
  combat: null,             // instância atual do combate
  turno: null,              // índice do turno atual
  round: null,              // número do round atual
  cenaId: null,             // id da cena atual
  combatenteAtual: null,    // combatente atual (Combatant)
  tokenAtual: null,         // token do combatente
  atorAtual: null,          // ator do token atual
  atoresProcessados: new Set() // IDs dos atores já processados no round
};

// Variáveis auxiliares para detectar mudanças

let turnoAnterior = null;      // último turno registrado
let roundAnterior = null;      // último round registrado

console.log(`${prefixo} Variáveis globais inicializadas.`);
console.log(`${prefixo} Estado inicial:`, JSON.parse(JSON.stringify({
  turno: estadoCombate.turno,
  round: estadoCombate.round,
  atoresProcessados: Array.from(estadoCombate.atoresProcessados)
})));

//====================
// Bloco 1: Hook básico para updateCombat com logs iniciais
//====================
console.log(`${prefixo} Iniciando registro do hook 1.`);
// Hook para rastrear mudanças no combate (turno, round, etc.)
Hooks.on("updateCombat", async (combat, change) => {
	try {
		if (!game.user.isGM) return; // Apenas o GM executa
		console.log(`${prefixo} Hook [updateCombat] disparado.`);
		
		// Log detalhado do objeto change para inspecionar alterações
		console.log(`${prefixo} Alterações detectadas:`, JSON.parse(JSON.stringify(change)));
		
		if ("round" in change) {
			console.log(`${prefixo} Mudança de round detectada: ${combat.round}`);
		}
		
		if ("turn" in change) {
			console.log(`${prefixo} Mudança de turno detectada: ${combat.turn}`);
		}
		
		//====================
		// Bloco 2: Atualização do estado atual do combate
		//====================
		
		estadoCombate.combat = combat;
		estadoCombate.turno = combat.turn;
		estadoCombate.round = combat.round;
		estadoCombate.cenaId = combat.scene.id;
		estadoCombate.combatenteAtual = combat.combatant || null;
		estadoCombate.tokenAtual = estadoCombate.combatenteAtual?.token || null;
		estadoCombate.atorAtual = null;
		
		if (turnoAnterior === null) {
			turnoAnterior = estadoCombate.turno;
			console.log(`${prefixo} Inicializando turnoAnterior: ${turnoAnterior}`);
		}
		
		if (roundAnterior === null) {
			roundAnterior = estadoCombate.round;
			console.log(`${prefixo} Inicializando roundAnterior: ${roundAnterior}`);
		}
		
		const nomeAtor = estadoCombate.tokenAtual?.name || "(desconhecido)"; // voltarei a usar no bloco 6
		
		console.log(`${prefixo} Estado do combate atualizado:`);
		console.log(`${prefixo} Round: ${estadoCombate.round} | Turno: ${estadoCombate.turno} | Ator atual: ${nomeAtor}`);
		
		//====================
		// Bloco 3: Detecção do tipo de movimento
		//====================
		
		// Inicializa variável para registrar qual tipo de movimento ocorreu
		let movimento = "sem mudança";
		
		// Só executa se houve mudança em round ou turno
		if ("round" in change || "turn" in change) {
			
			// Caso 1: Avanço de round
			if (estadoCombate.round > roundAnterior) {
				
				// Se estamos no primeiro turno e o último turno anterior era o último combatente
				// então foi um avanço natural de round (fim do último turno)
				if (estadoCombate.turno === 0 && turnoAnterior === combat.combatants.size - 1) {
					movimento = "Avanço de round (fim do último turno)";
					console.log(`${prefixo} Avanço de Round Natural.`);
					
					//Dispara o evento de avanço de round natural
					Hooks.call("ichooseroll.avancoroundnatural", combat, roundAnterior, combat.round);
					console.log(`${prefixo} Evento: "ichooseroll.avancoroundnatural" disparado.`);
				} else {
					
					// Caso contrário, foi um avanço manual (GM clicou pra frente no round)
					movimento = "Avanço de round (manual)";
					console.log(`${prefixo} Avanço de Round Manual.`);
					
					//Dispara o evento de avanço de round manual
					Hooks.call("ichooseroll.avancoroundmanual", combat, roundAnterior, combat.round);
					console.log(`${prefixo} Evento: "ichooseroll.avancoroundmanual" disparado.`);
				}
				
				// Como é novo round, limpamos a lista de atores processados
				limparProcessados("novo round iniciado");
				
				// Caso 2: Retrocesso de round
			} else if (estadoCombate.round < roundAnterior) {
				
				// Se estamos no último turno e antes estávamos no primeiro turno,
				// foi um retrocesso natural (GM voltou do primeiro turno para o round anterior)
				if (estadoCombate.turno === combat.combatants.size - 1 && turnoAnterior === 0) {
					movimento = "Retrocesso de round (retrocesso do primeiro turno)";
					console.log(`${prefixo} Retrocesso de round "natural".`);
					
					//Dispara o evento de retrocesso de round natural
					Hooks.call("ichooseroll.retornoroundnatural", combat, roundAnterior, combat.round);
					console.log(`${prefixo} Evento: "ichooseroll.retornoroundnatural" disparado.`);
					
				} else {
					
					// Caso contrário, retrocesso manual (GM clicou para trás no round)
					movimento = "Retrocesso de round (manual)";
					console.log(`${prefixo} Retrocesso de round manual.`);
					
					//Dispara o evento de retrocesso de round manual
					Hooks.call("ichooseroll.retornoroundmanual", combat, roundAnterior, combat.round);
					console.log(`${prefixo} Evento: "ichooseroll.retornoroundmanual" disparado.`);
				}
				
				// Como voltamos de round, também limpamos a lista de processados
				limparProcessados("round retrocedido");
				
			// Caso 3: Avanço de turno
			} else if (estadoCombate.turno > turnoAnterior) {
				movimento = "Avanço de turno";
				
			// Caso 4: Retrocesso de turno
		    } else if (estadoCombate.turno < turnoAnterior) {
				movimento = "Retrocesso de turno";
				console.log(`${prefixo} Retrocesso de turno.`);
				
				//Dispara o evento de retrocesso de turno
				Hooks.call("ichooseroll.retornoturno", combat, turnoAnterior, combat.turn);
				console.log(`${prefixo} Evento: "ichooseroll.retornoturno" disparado.`);
			
			// Em caso de retrocesso de turno, removemos o ator atual da lista de processados
			// para permitir que ele seja processado novamente quando chegar sua vez
			if (estadoCombate.tokenAtual) {
				 estadoCombate.atoresProcessados.delete(estadoCombate.tokenAtual.id);
				 console.log(`${prefixo} Token ${estadoCombate.tokenAtual.name} removido dos processados para reprocessar.`);
				 await estadoCombate.tokenAtual.unsetFlag(mID, BP);
				 console.log(`${prefixo} Flag ${BP} removida do TokenDocument para ${estadoCombate.tokenAtual.name}.`);
			    }
			}
		}
		
		// Loga no console qual movimento foi detectado nesta atualização
		console.log(`${prefixo} Movimento detectado: ${movimento}`);
		
		// Atualiza as variáveis auxiliares para as comparações da próxima vez
		turnoAnterior = estadoCombate.turno;
		roundAnterior = estadoCombate.round;
		
		//====================
		// Bloco 4: Marcação dos atores processados no round
		//====================
		
		// Para fins de depuração: imprime no console a lista atual de atores processados
		console.log(`${prefixo} Atores processados no round atual:`, Array.from(estadoCombate.atoresProcessados));
		
		//====================
		// Bloco 5: Limpeza dos processados quando apropriado
		//====================
		
		async function limparProcessados(motivo = "motivo não especificado") {
			
			// Etapa 1: Limpa a memória interna (Set)
			estadoCombate.atoresProcessados.clear(); // Remove todos os IDs da memória
			console.log(`${prefixo} Lista de atores processados limpa na memória. Motivo: ${motivo}`);
			
			// Etapa 2: Obtém a cena atual para acessar os tokens
			const cena = game.scenes.get(estadoCombate.cenaId);
			if (!cena) {
				console.warn(`${prefixo} Cena não encontrada para limpeza das flags.`);
				return;
			}
			
			// Etapa 3: Itera sobre todos os tokens da cena
			for (const tokenDoc of cena.tokens) {
				
				// Etapa 3a: Verifica se o token é válido
				if (!tokenDoc) continue;
				
				// Etapa 3b: Lê a flag do token para verificar se está marcada
				const flag = tokenDoc.getFlag(mID, BP);
				
				// Etapa 3c: Se a flag estiver presente, remove
				if (flag) {
					await tokenDoc.unsetFlag(mID, BP);
					console.log(`${prefixo} Flag ${BP} removida do TokenDocument para ${tokenDoc.name}.`);
				}
			}
			
			// Etapa 4: Finaliza a limpeza
			console.log(`${prefixo} Todas as flags ${BP} removidas dos tokens da cena.`);
		}
	} catch (e) {
		console.error("Erro no hook ichooseroll.…", e);
	}
});
console.log(`${prefixo} Hook 1 registrado, Iniciando registro do hook 2.`);
//====================
// Bloco 6: Sincroniza memória com as flags dos tokens e exibe status no chat
//====================

Hooks.once("ready", () => {
	
	// espera para garantir que as cenas estão disponiveis
	setTimeout(() => {
		// Verifica se é GM e se há combate iniciado
		if (game.user.isGM && game.combat?.started) {
			console.log(`${prefixo} Detecção de combate já iniciado no carregamento. Sincronizando estado a partir das flags.`);
			
			const cenaId = game.combat.scene.id;            // ID da cena atual
			const cena = game.scenes.get(cenaId);           // Referência para a cena atual
			const tokensCena = cena.tokens;                 // Coleção dos tokens presentes na cena
			
			// Limpa memória interna antes de sincronizar
			estadoCombate.atoresProcessados.clear();
			console.log(`${prefixo} Memória interna limpa antes da sincronização.`);
			
			// Itera todos os tokens da cena e sincroniza a memória com as flags
			for (const tokenDoc of tokensCena) {
				
				// Verifica se o token é válido
				if (!tokenDoc) {
					console.warn(`${prefixo} Token indefinido encontrado. Ignorado.`);
					continue;
				}
				
				// Lê a flag persistente no TokenDocument
				const flag = tokenDoc.getFlag(mID, BP);
				
				// Se a flag estiver marcada como true, adiciona ao Set interno
				if (flag) {
					estadoCombate.atoresProcessados.add(tokenDoc.id);
					console.log(`${prefixo} Token ${tokenDoc.name} (${tokenDoc.id}) encontrado com flag ${BP} e registrado na memória.`);
					
				} else {
					console.log(`${prefixo} Token ${tokenDoc.name} (${tokenDoc.id}) não possui flag ${BP}.`);
				}
			}
		}
	}, 5000); // espera 5 segundos
});

console.log(`${prefixo} Hook 2 registrado, Iniciando registro do hook 3.`);
//====================
// Bloco 7: Marcação persistente no final do turno com pf2e.endTurn
//====================

// Hook para registrar o token como processado no final do turno

Hooks.on("pf2e.endTurn", (combatant) => {
	if (!game.user.isGM) return; // Apenas o GM executa 
	console.log(`${prefixo} Hook [pf2e.endTurn] disparado.`);
	
	// Verifica e obtém o TokenDocument do combatente atual
	const token = combatant.token;
	if (!token) {
		console.warn(`${prefixo} Combatente sem token no endTurn. Ignorado.`);
		return;
	}
	
	// Marca o token no Set interno e grava a flag no TokenDocument
	estadoCombate.atoresProcessados.add(token.id);
	console.log(`${prefixo} Token ${token.name} (${token.id}) adicionado ao Set de processados.`);
	token.setFlag(mID, BP, true).then(() => {
		console.log(`${prefixo} Flag ${BP} gravada no TokenDocument para ${token.name}.`);
		
	}).catch(err => {
		console.error(`${prefixo} Erro ao gravar flag ${BP} para ${token.name}:`, err);
		
	}).finally(() => {
		
	});
});

console.log(`${prefixo} Hook 3 registrado, Iniciando registro do hook 4.`);
//====================
// Hook: Ajusta o sort para -50 para tokens com efeito dead + overlay
//====================

Hooks.on("updateToken", async (doc, alteracoes) => {
	try {
		// Apenas o GM executa a verificação e ajuste
		if (!game.user.isGM) return;
		
		console.log(`${prefixo} Hook [updateToken] disparado para verificar mortos.`);
		
		const ator = doc.actor;
		if (!ator) return;
		
		// Verifica se o ator possui um efeito com status "dead" e flag overlay=true
		const estaMorto = ator.effects.some(e =>
		 e.statuses?.has?.("dead") && getProperty(e, "flags.core.overlay") === true
		);
		
		// Se não está morto, não faz nada
		if (!estaMorto) {
			console.log(`${prefixo} Token ${doc.name} não está morto, ignorado.`);
			return;
		}
		
		// Obtém o valor atual do sort, usando 0 caso esteja indefinido
		const sortAtual = doc.sort ?? 0;
		
		// Se já está em -50, não faz nada
		if (sortAtual === -50) {
			console.log(`${prefixo} Token ${doc.name} já tem sort -50, nada a fazer.`);
			return;
		}
		
		// Atualiza o sort para -50 para colocar o token abaixo dos demais
		await doc.update({ sort: -50 });
		console.log(`${prefixo} Token ${doc.name} atualizado para sort -50 por estar morto.`);
		
	} catch (e) {
		// Captura e loga qualquer erro sem quebrar outros hooks
		console.error(`${prefixo} Erro ao ajustar sort para morto:`, e);
	}
});

console.log(`${prefixo} Hook 4 registrado.`);