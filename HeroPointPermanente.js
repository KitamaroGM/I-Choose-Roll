//====================
// HeroPointPermanente.js
//====================
console.log(`I Choose Roll! [Hero Point Permanente] 1.0.174 carregado — inicializando variáveis e constantes`);

//====================
// Bloco 0 - Constantes usadas nos Hooks de Hero Point Permanente
//====================
const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle;margin:0 4px 0 0;display:inline-block;">`;
const logoP = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="28" height="28" style="vertical-align:middle; margin-right:6px;">`;
const logoPP = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="16" height="16" style="vertical-align:middle; margin-right:4px;">`;
const prefixo = "I Choose Roll! [Hero Point Permanente]";
const mID = "i-choose-roll";

// modo debug
const logDebug = (...args) => {
  const fn = window?.logDebug ?? (() => {});
  return fn(...args);
};


// define as chaves utilizadas pelo sistema HPdC
const chavesHPdC = [
    "heroPointsDaCasa",
	"HPdCDefensivo",
	"HPdCRoubado",
	"HPdCNoDano",
	"HPdCConsolacao"
];

let iconeHPdC = window.iconeHPdC || logoP;
let nomeHPdC = window.nomeHPdC || "Hero Point da Casa";

//====================
// Bloco 1 - Hook ready para inicializar a flag nos personagens dos jogadores
//====================

// Ativa configurações do sistemas
const estaAtiva = (chave) => game.settings.get(mID, chave);
console.log(`${prefixo} Registrando hook ready para inicializar a flag Hero Point Permanente`);
console.log(`${prefixo} Iniciando registro do hook 1.`);

Hooks.once("ready", async () => {
	
	const socket = game.modules.get(mID).api.socket;
	
	if (!game.user.isGM) return;
	
	try {

		logDebug(`${prefixo} Inicializando Hero Point Permanente em personagens de jogadores`);

		for (const ator of game.actors.contents) {
			// Verifica se é personagem 
			if (ator.type !== "character") continue;

			const atual = await ator.getFlag("i-choose-roll", "heroPointsDaCasa");
			if (atual === undefined) {
				await ator.setFlag("i-choose-roll", "heroPointsDaCasa", 0);
				logDebug(`${prefixo} Flag inicializada em 0 para ${ator.name}`);
			}
		}
		
		//====================
		// Bloco - Inicialização das flags de uso de HPdC (apenas se não existirem)
		//====================
		logDebug(`${prefixo} Iniciando verificação de flags de uso de HPdC nos personagens.`);
		
		// Define os tipos de uso que terão flags individuais
		const tiposDeUsoHPdC = chavesHPdC.filter(t => t !== "heroPointsDaCasa");
		
		// Percorre todos os atores do tipo personagem
		for (const ator of game.actors.contents) {
			if (ator.type !== "character") continue;
			
			logDebug(`${prefixo} Verificando ator: ${ator.name}`);
			
			// Percorre cada tipo de uso individualmente
			for (const tipo of tiposDeUsoHPdC) {
				
				// Verifica se a flag já existe no ator
				const flagExistente = await ator.getFlag(mID, tipo);
				
				// Cria a flag apenas se ela ainda não existir
				if (flagExistente === undefined) {
					
					// Grava a flag com valor inicial 0
					await ator.setFlag(mID, tipo, { atual: 0 });
					logDebug(`${prefixo} Flag "${tipo}" criada com valor atual 0 para ${ator.name}`);
					
				} else {
					
					// Flag já existe, nenhuma modificação necessária
					logDebug(`${prefixo} Flag "${tipo}" já existe para ${ator.name} — nenhuma alteração feita`);
				}
			}
		}
		
		//====================
		// Bloco - Registro de vínculos de HPdC entre mestres e subordinados
		//====================
		logDebug(`${prefixo} Iniciando varredura de vínculos HPdC via Toolbelt.`);
		
		for (const ator of game.actors.contents) {
			if (ator.type !== "character") continue;
			
			const configuracao = ator.getFlag("pf2e-toolbelt", "share.config");
			
			if (configuracao?.master) {
				const idMestre = configuracao.master;
				
				const sincronias = {
					health: configuracao.health ?? false,
					turn: configuracao.turn ?? false,
					skills: configuracao.skills ?? false,
					hero: configuracao.hero ?? false,
					weapon: configuracao.weapon ?? false,
					armor: configuracao.armor ?? false
				};
				
				// cria a flag no subordinado com ID do mestre e configurações
				await ator.setFlag(mID, "vinculoHPdC", { idMestre, sincronias });
				logDebug(`${prefixo} Subordinado ${ator.name} vinculado ao mestre ${idMestre}`);
				
				// tenta encontrar o mestre e atualizar a lista de subordinados
				const mestre = game.actors.get(idMestre);
				
				if (mestre) {
					const existente = (await mestre.getFlag(mID, "vinculoHPdC")) ?? {};
					const lista = new Set(existente.subordinados ?? []);
					lista.add(ator.id);
					
					await mestre.setFlag(mID, "vinculoHPdC", {
						...(await mestre.getFlag(mID, "vinculoHPdC")),  // preserva o restante da flag
						subordinados: Array.from(lista)                 // atualiza apenas subordinados
					});
					
					logDebug(`${prefixo} Mestre ${mestre.name} atualizado com subordinado ${ator.name}`);
					
				} else {
					console.warn(`${prefixo} Mestre com ID ${idMestre} não encontrado para o subordinado ${ator.name}`);
				}
			}
		}
		
	} catch (e) {
		console.error(`${prefixo} Erro ao inicializar Hero Point Permanente nos personagens:`, e);
	}
});

//====================
// Hook - Atualiza vínculos HPdC caso flags Toolbelt sejam alteradas durante o jogo
//====================
Hooks.on("updateActor", async (ator, data) => {
	
	// ignora se não for personagem
	if (ator.type !== "character") return;

	// verifica se a flag de mestre foi alterada
	const configToolbelt = foundry.utils.getProperty(data, "flags.pf2e-toolbelt.share.config");
	if (!configToolbelt) return;

	logDebug(`${prefixo} [updateActor] Verificando atualização de vínculo HPdC para ${ator.name}`);

	const idMestre = configToolbelt.master;

	// se não houver mestre declarado, nada a fazer
	if (!idMestre) return;

	const sincronias = {
		health: configToolbelt.health ?? false,
		turn: configToolbelt.turn ?? false,
		skills: configToolbelt.skills ?? false,
		hero: configToolbelt.hero ?? false,
		weapon: configToolbelt.weapon ?? false,
		armor: configToolbelt.armor ?? false
	};

	// atualiza a flag no subordinado
	await ator.setFlag(mID, "vinculoHPdC", { idMestre, sincronias });
	logDebug(`${prefixo} [updateActor] Flag de subordinado registrada para ${ator.name}`);

	// atualiza a flag no mestre, se encontrado
	const mestre = game.actors.get(idMestre);
	if (mestre) {
		const existente = (await mestre.getFlag(mID, "vinculoHPdC")) ?? {};
		const lista = new Set(existente.subordinados ?? []);
		lista.add(ator.id);

		await mestre.setFlag(mID, "vinculoHPdC", {
			...(await mestre.getFlag(mID, "vinculoHPdC")),  // preserva o restante da flag
			subordinados: Array.from(lista)                 // atualiza apenas subordinados
		});

		logDebug(`${prefixo} [updateActor] Mestre ${mestre.name} atualizado com subordinado ${ator.name}`);
	} else {
		console.warn(`${prefixo} [updateActor] Mestre com ID ${idMestre} não encontrado para o subordinado ${ator.name}`);
	}
});

//====================
// Bloco 2 - Hook para injetar Hero Point Permanente na ficha
//====================
console.log(`${prefixo} Hook 1 registrado, Iniciando registro do hook 2.`);
	
Hooks.on("renderActorSheet", async (app, html, data) => {
	
	//Verifica se está ligado nas configurações
	if (!estaAtiva("ativarHeroPointDaCasa")) {
		logDebug(`${prefixo} Desativado nas configurações. Ignorando renderActorSheet.`);
		return;
	}
	
	// Verificação de pré-requisito (efeito, feat ou trait)
	const ator = game.actors.get(app.actor.id) ?? app.actor;
	const tipoRequisito = window.HPdCRequizitoTipo;
	const slugRequisito = window.HPdCRequisitoSlug?.trim();
	
	if (tipoRequisito !== "nenhum") {
		let possui = false;
		
		if (tipoRequisito === "feat") {
			possui = ator.itemTypes.feat.some(f => f.slug === slugRequisito);
			
		} else if (tipoRequisito === "trait") {
			possui = ator.system.traits?.value?.includes(slugRequisito);
			
		} else if (tipoRequisito === "effect") {
			possui = ator.itemTypes.effect.some(e => e.slug === slugRequisito);
		}
		
		if (!possui) return logDebug(`${prefixo} ${ator.name} não cumpre requisito (${tipoRequisito}: ${slugRequisito}) — cancelando render.`);

	}
	
	const nomeHPdC = game.settings.get(mID, "nomeHPdC")?.trim() || "Hero Point da Casa";
	
	try {
	
		// Verifica se é um ator do tipo personagem
		if (ator.type !== "character") return;
		logDebug(`${prefixo} Injetando Hero Point Permanente na ficha de ${ator.name}`);
		
		// Seleciona a área dos hero points padrão
		const header = html.find('header.char-header');
		
		if (!header.length) {
			console.warn(`${prefixo} Não foi possível encontrar o header.char-header para ${ator.name}`);
			return;
		}
		
		const container = header.find('.dots');
			
		// Verifica se HPdC é adicional ao HP padrão
		const adicional = game.settings.get(mID, "heroPointsDaCasaAdicional") ?? true;
		
		if (!adicional) {
		
			// Oculta o recurso padrão de Hero Points
			container.children().css("visibility", "hidden");
			logDebug(`${prefixo} Hero Points padrão tornados invisíveis (nome e bolinhas) mas mantendo espaço para alinhamento para ${ator.name}`);
		}
		
		if (!container.length) {
			console.warn(`${prefixo} Não foi possível encontrar o .dots dos Hero Points para ${ator.name}`);
			return;
		}
	
		//atualiza o valor maximo de acordo com a configuração
		const max = game.settings.get(mID, "valorHPdC") ?? 3;
		
		let iconeHPdC = game.settings.get(mID, "iconeHPdC")?.trim();
		
		if (iconeHPdC) {
			iconeHPdC = `<img src="${iconeHPdC}" alt="iconeHPdC" width="28" height="28" style="vertical-align:middle; margin-right:6px; border:none;">`;
			
		} else {
			iconeHPdC = logoP;
		}
		
		const permanente = $(`
		 <div class="resource" data-resource="heroPointsDaCasa" style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
		  <div style="flex: 0 0 auto;"></div>
		   <div style="display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 2px; min-height: 40px;">
		     <span style="font-size: 11px;">${nomeHPdC}</span>
			 <span class="resource-value" style="font-size: 22px;"></span>
		   </div>
		  </div>
	   `);
	
		permanente.find('div').first().html(iconeHPdC);
	   logDebug("Conteúdo da div ícone:", permanente.find('div').first().html());
	   
	   // Adiciona cursor de "mãozinha" ao resource-value
	   permanente.find(".resource-value").css("cursor", "pointer");
	   
	   // Insere após o bloco de Hero Points padrão
	   container.after(permanente);
	   permanente.find("span").first().text(nomeHPdC);
	   
	   // tamanho e posição das bolinhas
	   permanente.find(".resource-value").css({
		   "font-size": "22px",
		   "line-height": "1",
		   "position": "relative",
		   "top": "-2px",
		   "left": "-2px"
		});
		
		// posição do nome
		permanente.find("span").first().css({
			"position": "relative",
			"top": "2px",
			"left": "0px"
		});
		
		// Cria bolinhas
		async function renderizarBolinhasHeroPoint() {
			
			const valor = (await ator.getFlag("i-choose-roll", "heroPointsDaCasa")) ?? 0;
			const bolinhas = [];
			
			for (let i = 0; i < max; i++) {
				bolinhas.push(i < valor ? '●' : '○');
			}
			
			permanente.find(".resource-value").text(bolinhas.join(" "));
			
			// Tooltip principal dinamica
			let tooltipTexto = `${valor}/${max} ${nomeHPdC}`;
			
			// Tipos de uso com limites
			const tiposComLimite = [
			 { chave: "HPdCConsolacao", nome: "Consolação", limite: window.HPdCCLimite },
			 { chave: "HPdCDefensivo", nome: "Defensivo", limite: window.HPdCDfLimite },
			 { chave: "HPdCRoubado", nome: "Keeley", limite: window.HPdCRLimite },
			 { chave: "HPdCNoDano", nome: "No Dano", limite: window.HPdCDLimite }
			];
			
			// Adiciona ao tooltip os tipos com limites definidos
			for (const { chave, nome, limite } of tiposComLimite) {

				if (limite > 0) {
					let regraLigada = false;
					
					if (chave === "HPdCConsolacao") {
						regraLigada = game.settings.get(mID, "HPdCConsolacao") === true;
						
					} else if (chave === "HPdCRoubado") {
						regraLigada = game.settings.get(mID, "HPdCRoubado") === true;
						
					} else if (chave === "HPdCNoDano") {
						regraLigada = game.settings.get(mID, "HPdCNoDano") !== "Desligado";
						
					} else if (chave === "HPdCDefensivo") {
						regraLigada = game.settings.get(mID, "HPdCDefensivo") !== "Desligado";
					}
					
					if (!regraLigada) continue; // ignora se a regra não está ativa
					
					const dados = await ator.getFlag(mID, chave);
					const atual = dados?.atual ?? 0;
					tooltipTexto += `<br>${atual}/${limite} ${nome}`;
				}
			}
			
			permanente.find(".resource-value")
			.attr("data-tooltip", tooltipTexto)
			.attr("data-tooltip-direction", "LEFT");
		}
		
		await renderizarBolinhasHeroPoint();
		
		permanente.find(".resource-value").off("mousedown").on("mousedown", async ev => {
			ev.preventDefault();
			
			// Registra valores antigos e novos para rastreio
			const antigo = (await ator.getFlag("i-choose-roll", "heroPointsDaCasa")) ?? 0;
			let novo = antigo;
			
			if (ev.button === 0) {
				
				// Esquerdo
				novo = Math.min(novo + 1, max);
				
			} else if (ev.button === 2) {
				
				// Direito
				novo = Math.max(novo - 1, 0);
			}
			
			await ator.setFlag("i-choose-roll", "heroPointsDaCasa", novo);
			
			// Dispara o Hook para sincronia
			const todasAsFlags = {};
			for (const chave of chavesHPdC) {
				todasAsFlags[`flags.i-choose-roll.${chave}`] = await ator.getFlag("i-choose-roll", chave);
			}
			
			Hooks.call("HPdCMudançaUI", ator, {
				id: ator.id,
				antigo,
				novo,
				flags: todasAsFlags
			});
			
			// Atualiza visual na ficha
			await renderizarBolinhasHeroPoint();
		});
		
	} catch (e) {
		console.error(`${prefixo} Erro ao injetar Hero Point Permanente:`, e);
	}
});

//====================
// Bloco - Hook createActor para inicializar flags em novos personagens
//====================
console.log(`${prefixo} Registrando hook createActor para inicializar flags em novos personagens.`);

Hooks.on("createActor", async (atorCriado, opcoes, usuarioID) => {
	
	// Verifica se o ator criado é um personagem
	if (atorCriado.type !== "character") return;
	
	logDebug(`${prefixo} Novo personagem detectado: ${atorCriado.name}`);
	
	// Inicializa a flag principal de Hero Point da Casa
	const flagHPdC = await atorCriado.getFlag(mID, "heroPointsDaCasa");
	if (flagHPdC === undefined) {
		await atorCriado.setFlag(mID, "heroPointsDaCasa", 0);
		logDebug(`${prefixo} Flag "heroPointsDaCasa" criada com valor 0 para ${atorCriado.name}`);
	}
	
	
	// Inicializa cada flag de tipo, se ainda não existir
	for (const tipo of chavesHPdC.filter(t => t !== "heroPointsDaCasa")) {
		const flagExistente = await atorCriado.getFlag(mID, tipo);
		
		if (flagExistente === undefined) {
			await atorCriado.setFlag(mID, tipo, { atual: 0 });
			logDebug(`${prefixo} Flag "${tipo}" criada com valor atual 0 para ${atorCriado.name}`);
		}
	}
	
	logDebug(`${prefixo} Inicialização de flags concluída para ${atorCriado.name}`);
});

//====================
// Bloco 3 - MutationObserver para HPdC no menu do chat (ativado condicionalmente)
//====================
Hooks.once("ready", () => {
	logDebug(`${prefixo} [MutationObserver] Hook ready disparado.`);
	
	// Verifica se a opção está ativa nas configurações
	if (!estaAtiva("ativarHeroPointDaCasa")) {
		logDebug(`${prefixo} [MutationObserver] Desativado nas configurações. Não será iniciado.`);
		return;
	}
	
	// Macro: Ativar MutationObserver para HPdC no menu do chat (com contextoHPdC + remoção HP padrão)
	logDebug(`${prefixo} Iniciando MutationObserver para o menu do chat.`);
	
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;
				
				if (node.id === "context-menu") {
					logDebug(`${prefixo} Menu de contexto detectado.`);
					
					// Lê as configurações atuais no momento do render
					let iconeHPdC = game.settings.get("i-choose-roll", "iconeHPdC")?.trim();
					if (!iconeHPdC) {
						iconeHPdC = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle; margin-right:8px;">`;
						
					} else if (!iconeHPdC.startsWith("<img")) {
						iconeHPdC = `<img src="${iconeHPdC}" alt="HPdC" width="32" height="32" style="vertical-align:middle; margin-right:8px;">`;
					}
					
					//Ajusta o tamanho do icone 
					let contextoHPdC;
					if (iconeHPdC.includes("<img")) {
						contextoHPdC = iconeHPdC
						.replace(/width="\d+"/, 'width="16"')
						.replace(/height="\d+"/, 'height="16"');
						
					} else {
						contextoHPdC = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="18" height="18" style="vertical-align:middle; margin-right:8px;">`;
					}
					
					const nomeHPdC = game.settings.get("i-choose-roll", "nomeHPdC")?.trim() || "Hero Point da Casa";
					const adicional = game.settings.get("i-choose-roll", "heroPointsDaCasaAdicional") ?? true;
					
					logDebug(`${prefixo} iconeHPdC original: ${iconeHPdC}`);
					logDebug(`${prefixo} contextoHPdC para menu: ${contextoHPdC}`);
					logDebug(`${prefixo} nomeHPdC: ${nomeHPdC}`);
					logDebug(`${prefixo} heroPointsDaCasaAdicional: ${adicional}`);
					
					// Procura os <li> e atualiza ou remove conforme necessário
					node.querySelectorAll("li.context-item").forEach($li => {
						const textoAtual = $li.textContent.trim();
						
						// Atualiza HPdC customizado
						if (textoAtual === "Reroll using a House Rule Hero Point") {
							logDebug(`${prefixo} Entrada HPdC encontrada.`);
							
							
							$li.innerHTML = `<span style="display: inline-flex; align-items: center;">${contextoHPdC}<span>Usar ${nomeHPdC}</span></span>`;
							logDebug(`${prefixo} Texto atualizado para: ${contextoHPdC} Usar ${nomeHPdC}`);
						}
						
						// Remove Hero Point padrão se adicional === false
						if (textoAtual === "Reroll using a Hero Point") {
							if (!adicional) {
								logDebug(`${prefixo} HPdCAdicional = false → removendo entrada padrão.`);
								$li.remove();
							} else {
								logDebug(`${prefixo} HPdCAdicional = true → mantendo entrada padrão.`);
							}
						}
					});
				}
			}
		}
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
});
console.log(`${prefixo} MutationObserver iniciado e aguardando o menu.`);

//====================
// HPdCKanto - Função principal de processamento do Hero Point da Casa (tema Pokémon)
//====================
console.log(`${prefixo} Registrando jornada por kanto, registrando região Kanto`);

async function HPdCKanto(mensagem) {
  logDebug(`${prefixo} [HPdCKanto] Iniciando jornada com a mensagem ID ${mensagem.id}`);
  
  //====================
  // Bloco de Constantes Internas
  //====================

  const usuario = game.user;
  const atorPrincipal = mensagem.actor;
  const contexto = mensagem.flags?.pf2e?.context ?? {};

  const configuracoes = {
    limiteConsolacao: game.settings.get(mID, "HPdCCLimite"),
    limiteDefensivo: game.settings.get(mID, "HPdCDfLimite"),
    limiteNoDano: game.settings.get(mID, "HPdCDLimite"),
    limiteRoubado: game.settings.get(mID, "HPdCRLimite"),
    slugRequisito: game.settings.get(mID, "HPdCRequisitoSlug"),
    usarMaior: game.settings.get(mID, "HPdCMaior")
  };

  const ginasiosDisponiveis = {
    GinasioNormal,
    GinasioDoDano,
    GinasioKeeley
    // outros ginásios futuros podem ser adicionados aqui
  };

  //Coleta de dados da mensagem, usuário e configurações
  const dadosKanto = await coletarDadosKanto(mensagem);
  if (!dadosKanto) return;

  // Decide se segue pela Rota Defensiva ou Tradicional=
  await escolherRotaKanto(dadosKanto);
  if (!dadosKanto.nomeDoGinasio) return;
  
  // se for rota defensiva, aguarda aprovação do GM
  if (dadosKanto.rota === "Defensiva") {
	  const socket = socketlib.registerModule(mID);
	  const permitido = await socket.executeAsGM("aceitarDesafioSocket", dadosKanto);
	  
	  if (!permitido) {
		  logDebug(`${prefixo} Rerolagem defensiva negada pelo GM.`);
		  return;
		}
	}

  // Chama o ginásio específico de acordo com a rota e o tipo de uso
  await dadosKanto.ginasiosDisponiveis[dadosKanto.nomeDoGinasio](dadosKanto);

  // Monta a nova mensagem de chat com a rolagem final
  await montarEliteKanto(dadosKanto);

  // Aplica decremento, consolação e finaliza o uso
  await encerrarKanto(dadosKanto);
}

//====================
// coletarDadosKanto - Bloco Inicial da jornada HPdC (coleta de dados da mensagem, usuário e atores controlados)
//====================
console.log(`${prefixo} Registrando jornada por kanto, registro da região Kanto terminado. Pegando dados do treinador`);

async function coletarDadosKanto(mensagem) {
  logDebug(`${prefixo} [coletarDadosKanto] Iniciando coleta de dados para a mensagem ID ${mensagem.id}`);

  //====================
  // Bloco de Constantes Internas
  //====================
  const usuario = game.user;
  const mensagemUser = mensagem.user;
  const atorPrincipal = mensagem.actor ?? null;
  const contexto = mensagem.flags?.pf2e?.context ?? {};
  const token = mensagem.token ?? null;
  const speaker = mensagem.speaker ?? null;
  let dadosKanto = {
  rota: null
};

  // cópia completa da mensagem para uso futuro ou comparação
  const dadosMensagemOriginal = mensagem;


  //====================
  // Bloco de Coleta das Configurações
  //====================
  const configuracoes = {
    limiteConsolacao: game.settings.get(mID, "HPdCCLimite"),
    limiteDefensivo: game.settings.get(mID, "HPdCDfLimite"),
    limiteNoDano: game.settings.get(mID, "HPdCDLimite"),
    limiteRoubado: game.settings.get(mID, "HPdCRLimite"),
    slugRequisito: game.settings.get(mID, "HPdCRequisitoSlug"),
    usarMaior: game.settings.get(mID, "HPdCMaior")
  };

  const ginasiosDisponiveis = {
    GinasioNormal,
    GinasioDoDano,
    GinasioKeeley
    // outros ginásios futuros podem ser adicionados aqui
  };

  //====================
  // Bloco de Coleta dos Atores Controlados pelo Usuário
  //====================
  let atoresControlados = [];

const atorMensagem = mensagem.actor;
const tipo = atorMensagem?.type;
const disposicao = atorMensagem?.token?.disposition ?? null;
const ehGM = game.user.isGM;

// CASO A: personagem com disposição normal — uso direto
if (tipo === "character" && disposicao !== -1) {
  logDebug(`${prefixo} [coletarDadosKanto] Ator da mensagem é personagem com disposição normal — uso direto.`);

  const nome = atorMensagem.name;
  const chavesFlags = ["HPdCConsolacao", "HPdCDefensivo", "HPdCNoDano", "HPdCRoubado"];
  const flagsHPdC = {};

  for (const chave of chavesFlags) {
    const valor = await atorMensagem.getFlag(mID, chave);
    if (typeof valor === "undefined") {
      console.warn(`${prefixo} [coletarDadosKanto] Ator "${nome}" não possui a flag ${chave}. Valor definido como null.`);
      flagsHPdC[chave] = null;
    } else {
      flagsHPdC[chave] = valor;
    }
  }

  const vinculo = getProperty(atorMensagem, `flags.${mID}.vinculoHPdC`) ?? {};
  const mestre = vinculo.mestre ?? null;
  const subordinados = Array.isArray(vinculo.subordinados) ? vinculo.subordinados : [];

  atoresControlados.push({
    id: atorMensagem.id,
    nome,
    ator: atorMensagem,
    flagsHPdC,
    eMestre: subordinados.length > 0,
    mestre,
    subordinados
  });

// CASO B: disposição -1 → rota defensiva + varredura

} else if (disposicao === -1) {
  dadosKanto.rota = "Defensiva";
  logDebug(`${prefixo} [coletarDadosKanto] Disposição -1 detectada — rota defensiva.`);

  for (const ator of game.actors) {
    if (!ator.testUserPermission(usuario, "OWNER")) continue;

    const nome = ator.name;
    const chavesFlags = ["HPdCConsolacao", "HPdCDefensivo", "HPdCNoDano", "HPdCRoubado"];
    const flagsHPdC = {};

    for (const chave of chavesFlags) {
      const valor = await ator.getFlag(mID, chave);
      if (typeof valor === "undefined") {
        console.warn(`${prefixo} [coletarDadosKanto] Ator "${nome}" não possui a flag ${chave}. Valor definido como null.`);
        flagsHPdC[chave] = null;
      } else {
        flagsHPdC[chave] = valor;
      }
    }

    const vinculo = getProperty(ator, `flags.${mID}.vinculoHPdC`) ?? {};
    const mestre = vinculo.mestre ?? null;
    const subordinados = Array.isArray(vinculo.subordinados) ? vinculo.subordinados : [];

    atoresControlados.push({
      id: ator.id,
      nome,
      ator,
      flagsHPdC,
      eMestre: subordinados.length > 0,
      mestre,
      subordinados
    });
  }

// CASO C: fallback — varredura com filtro se for GM
} else {
  logDebug(`${prefixo} [coletarDadosKanto] Situação normal — varrendo atores permitidos.`);

  for (const ator of game.actors) {
    if (!ator.testUserPermission(usuario, "OWNER")) continue;
    if (ehGM && (ator.type !== "character" || ator.prototypeToken?.disposition === -1)) continue;

    const nome = ator.name;
    const chavesFlags = ["HPdCConsolacao", "HPdCDefensivo", "HPdCNoDano", "HPdCRoubado"];
    const flagsHPdC = {};

    for (const chave of chavesFlags) {
      const valor = await ator.getFlag(mID, chave);
      if (typeof valor === "undefined") {
        console.warn(`${prefixo} [coletarDadosKanto] Ator "${nome}" não possui a flag ${chave}. Valor definido como null.`);
        flagsHPdC[chave] = null;
      } else {
        flagsHPdC[chave] = valor;
      }
    }

    const vinculo = getProperty(ator, `flags.${mID}.vinculoHPdC`) ?? {};
    const mestre = vinculo.mestre ?? null;
    const subordinados = Array.isArray(vinculo.subordinados) ? vinculo.subordinados : [];

    atoresControlados.push({
      id: ator.id,
      nome,
      ator,
      flagsHPdC,
      eMestre: subordinados.length > 0,
      mestre,
      subordinados
    });
  }
}

  logDebug(`${prefixo} [coletarDadosKanto] Coleta de atores finalizada. ${atoresControlados.length} atores controlados detectados.`);

  //====================
  // Retorno do Objeto dadosKanto
  //====================
  dadosKanto = {
    mensagem,
    dadosMensagemOriginal,
    mensagemUser,
    usuario,
    token,
    speaker,
    contexto,
    entradaMensagem: {
      ator: atorPrincipal,
      token: token
    },
    atoresControlados,
    configuracoes,
    ginasiosDisponiveis,
    rota: dadosKanto.rota,
    nomeDoGinasio: null,
    tipoHPdCUsado: null,
    novaRolagem: null,
    usouRoubado10: false
  };

  logDebug(`${prefixo} [coletarDadosKanto] Coleta finalizada com sucesso.`);
  dadosKanto.permanentes = await atorPrincipal.getFlag(mID, "heroPointsDaCasa") ?? 0;
  return dadosKanto;
}

//====================
// escolherRotaKanto - Define a rota (Defensiva ou Tradicional) e o ginásio a ser usado
//====================
console.log(`${prefixo} Registrando jornada por kanto. Dados do treinado registrados, escolhendo a rota e ginásio desafiado`);

async function escolherRotaKanto(dadosKanto) {
  logDebug(`${prefixo} [escolherRotaKanto] Iniciando escolha de rota e ginásio`);
  
//====================
// Bloco 2 - Determinar o pagante com base na rota
//====================

logDebug(`${prefixo} [escolherRotaKanto] Determinando pagante com base na rota: ${dadosKanto.rota}`);

let pagante = null;
let contexto = dadosKanto.contexto;

//====================
// Rota Defensiva
//====================
if (dadosKanto.rota === "Defensiva") {
  logDebug(`${prefixo} [escolherRotaKanto] Rota defensiva ativa. Avaliando tipo de contexto para identificar pagante.`);

  // Se for um teste de resistência (save), quem paga é o origin
  if (contexto?.type === "saving-throw" && contexto.origin) {
    const uuid = contexto.origin.actor;
	pagante = typeof uuid === "string" ? game.actors.get(uuid.replace("Actor.", "")) : null;
	logDebug(`${prefixo} [escolherRotaKanto] Tipo "save" detectado. Origin resolvido via UUID: ${pagante?.name ?? "indefinido"}`);
 }

  // Se for dano, o pagante está na flag alvoDano
  else if (!pagante && contexto?.type === "damage-roll") {
    const alvoId = dadosKanto.mensagem.flags?.[mID]?.target?.[0]?.actorId;
    if (alvoId) {
      pagante = game.actors.get(alvoId) ?? null;
      logDebug(`${prefixo} [escolherRotaKanto] Tipo "damage-roll" detectado. Alvo da flag definido como pagante: ${pagante?.name ?? "indefinido"}`);
    } else {
      console.warn(`${prefixo} [escolherRotaKanto] Flag alvoDano não encontrada na mensagem.`);
    }
  }

  // Caso seja uma rolagem D20 com alvo direto
  else if (!pagante && contexto?.target) {
    const uuidAtor = contexto.target?.actor ?? null;
    pagante = typeof uuidAtor === "string" ? game.actors.get(uuidAtor.replace("Actor.", "")) : null;
    logDebug(`${prefixo} [escolherRotaKanto] Alvo direto detectado em rolagem D20. Pagante definido como: ${pagante?.name ?? "indefinido"}`);
  }

  // Caso nenhum pagante válido seja encontrado
  if (!pagante) {
    console.warn(`${prefixo} [escolherRotaKanto] Nenhum pagante válido encontrado para a rota defensiva.`);
  }

} else {

//====================
// Rota Tradicional
//====================
  logDebug(`${prefixo} [escolherRotaKanto] Rota tradicional ativa. Verificando ator da mensagem.`);

  pagante = dadosKanto.mensagem.actor ?? null;
  const rolagemOriginal = dadosKanto.dadosMensagemOriginal.rolls?.[0];
  
  if (!pagante) {
    console.warn(`${prefixo} [escolherRotaKanto] Nenhum ator encontrado na mensagem.`);
  } else {
    logDebug(`${prefixo} [escolherRotaKanto] Ator da mensagem identificado: ${pagante.name}`);
  }

  // Se o pagante não for um personagem, verificar vínculo com mestre
  if (pagante?.type !== "character") {
    logDebug(`${prefixo} [escolherRotaKanto] Ator não é do tipo "character". Verificando se é subordinado.`);

    const mestreId = getProperty(pagante, `flags.${mID}.vinculoHPdC.mestre`);

    if (mestreId) {
      const mestre = game.actors.get(mestreId);
      if (mestre) {
        pagante = mestre;
        logDebug(`${prefixo} [escolherRotaKanto] Subordinado identificado. Mestre vinculado definido como pagante: ${pagante.name}`);
      } else {
        console.warn(`${prefixo} [escolherRotaKanto] Mestre vinculado não encontrado no sistema.`);
      }
    } else {
      logDebug(`${prefixo} [escolherRotaKanto] Nenhuma relação de mestre encontrada.`);
    }
  }
}

dadosKanto.pagante = pagante;

if (pagante) {
  logDebug(`${prefixo} [escolherRotaKanto] Pagante final definido: ${pagante.name}`);
} else {
  console.warn(`${prefixo} [escolherRotaKanto] Pagante não foi definido corretamente.`);
}

//====================
// Bloco 3 - Verificar ginásios disponíveis para o pagante
//====================

logDebug(`${prefixo} [escolherRotaKanto] Verificando ginásios disponíveis para o pagante: ${dadosKanto.pagante?.name ?? "indefinido"}`);

pagante = dadosKanto.pagante;
contexto = dadosKanto.contexto;
const flags = pagante?.flags?.[mID] ?? {};
const config = dadosKanto.configuracoes;

// Verifica se é uma rolagem D20 (rolagem direta de d20 no termo)
const isD20 = dadosKanto.mensagem?.rolls?.[0]?.terms?.some(t => t.faces === 20);

// Inicializa a estrutura de elegibilidade
dadosKanto.ginasiosElegiveis = {
  GinasioDoDano: false,
  GinasioKeeley: false,
  GinasioNormal: false
};

dadosKanto.KeeleyRequerConfirmacao = false;

//====================
// GINÁSIO DO DANO
//====================
if (contexto?.type === "damage-roll") {
  const limite = config.limiteNoDano;
  const usos = flags.HPdCNoDano?.atual ?? 0;

  if (limite === "" || limite === undefined) {
    dadosKanto.ginasiosElegiveis.GinasioDoDano = true;
    logDebug(`${prefixo} [escolherRotaKanto] GinasioDoDano elegível (uso ilimitado).`);
  } else if (limite > 0 && usos > 0) {
    dadosKanto.ginasiosElegiveis.GinasioDoDano = true;
    logDebug(`${prefixo} [escolherRotaKanto] GinasioDoDano elegível (limite = ${limite} e flag = ${usos}).`);
  } else {
    logDebug(`${prefixo} [escolherRotaKanto] GinasioDoDano inelegível (limite = ${limite} e flag = ${usos}).`);
  }
} else {
  logDebug(`${prefixo} [escolherRotaKanto] GinasioDoDano não avaliado: tipo da mensagem não é "damage-roll".`);
}

//====================
// GINÁSIO KEELEY
//====================
if (isD20 && game.settings.get(mID, "HPdCRoubado") === true) {
  const limite = Number(config.limiteRoubado);
  const usos = flags.HPdCRoubado?.atual ?? 0;
  
    // Uso ilimitado → elegível automaticamente
  if (!(limite > 0)) {
  dadosKanto.ginasiosElegiveis.GinasioKeeley = true;
  dadosKanto.KeeleyRequerConfirmacao = false;
  logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley elegível (uso ilimitado, sem confirmação).`);
  
    // Uso limitado → requer confirmação do jogador
} else if (usos > 0) {
  dadosKanto.ginasiosElegiveis.GinasioKeeley = true;
  dadosKanto.KeeleyRequerConfirmacao = true;
  logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley elegível (limite = ${limite} e flag = ${usos}, requer confirmação).`);
} else {
  logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley inelegível (limite = ${limite} e flag = ${usos}).`);
}

} else {
  logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley inelegível (rolagem não é D20 ou regra desligada).`);
}

//====================
// GINÁSIO NORMAL
//====================
if (isD20) {
  dadosKanto.ginasiosElegiveis.GinasioNormal = true;
  logDebug(`${prefixo} [escolherRotaKanto] GinasioNormal elegível (rolagem D20, sempre válido como fallback).`);
} else {
  logDebug(`${prefixo} [escolherRotaKanto] GinasioNormal inelegível (não é D20).`);
}

//====================
// Bloco 4 - Escolha do ginásio a ser usado
//====================
logDebug(`${prefixo} [escolherRotaKanto] Iniciando escolha do ginásio.`);

// Prioridade 1 - GinasioDoDano
if (dadosKanto.contexto?.type === "damage-roll" && dadosKanto.ginasiosElegiveis.GinasioDoDano) {
  dadosKanto.nomeDoGinasio = "GinasioDoDano";
  logDebug(`${prefixo} [escolherRotaKanto] GinasioDoDano selecionado.`);
  return; // nenhum outro ginásio será avaliado
}

// Prioridade 2 - GinasioKeeley
if (dadosKanto.ginasiosElegiveis.GinasioKeeley) {
  if (!dadosKanto.KeeleyRequerConfirmacao) {
    dadosKanto.nomeDoGinasio = "GinasioKeeley";
    logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley selecionado (uso ilimitado).`);
    return;
  } else {
	  
    // Confirmação necessária via chat
    logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley requer confirmação do jogador.`);
    const desejaUsar = await solicitarConfirmacaoKeeley(dadosKanto);
    if (desejaUsar) {
      dadosKanto.nomeDoGinasio = "GinasioKeeley";
      logDebug(`${prefixo} [escolherRotaKanto] GinasioKeeley confirmado pelo jogador.`);
      return;
    } else {
      logDebug(`${prefixo} [escolherRotaKanto] Jogador recusou usar o GinasioKeeley.`);
    }
  }
}

// Prioridade 3 - GinasioNormal (fallback de D20)
if (dadosKanto.ginasiosElegiveis.GinasioNormal) {
  dadosKanto.nomeDoGinasio = "GinasioNormal";
  logDebug(`${prefixo} [escolherRotaKanto] GinasioNormal selecionado como fallback.`);
  return;
}

// Fallback (impossível no design atual, mas seguro)
console.warn(`${prefixo} [escolherRotaKanto] Nenhum ginásio foi selecionado. Isso não deveria acontecer.`);
dadosKanto.nomeDoGinasio = null;

  logDebug(`${prefixo} [escolherRotaKanto] Ginásio selecionado: ${dadosKanto.nomeDoGinasio}`);
}

//====================
// solicitarConfirmacaoKeeley - Exibe mensagem de confirmação no chat para ativar o Caminho Keeley
//====================
console.log(`${prefixo} Registrando jornada por kanto. Rota e escolha de ginásio registrados, registrando solicitação de desafio ginásio roubado`);

async function solicitarConfirmacaoKeeley(dadosKanto) {
  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Iniciando exibição da mensagem de confirmação.`);

  //====================
  // Bloco 1 - Preparação de variáveis
  //====================
  const ator = dadosKanto.pagante;

  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Ator pagante: ${ator?.name ?? "indefinido"}`);
  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Bônus configurado: +${window.HPdCRBonus}`);
  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Limite de D20: ≤ ${window.HPdCRDado}`);

  //====================
  // Bloco 2 - Criação da mensagem no chat
  //====================
  const msgEscolha = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    content: `
      <div class="hpdc-escolha-keeley" data-msg-id="pendente">
        <p><strong style="font-size: 20px;">
          ${iconeHPdC.replace(/width="\\d+"/, 'width="22"').replace(/height="\\d+"/, 'height="22"')} ${nomeHPdC}
        </strong><br><br>
        Deseja usar o Caminho Keeley com <strong>+${window.HPdCRBonus}</strong> se o D20 for 
        <strong>≤ ${window.HPdCRDado}</strong>?</p>
        <div style="margin-top: 6px;">
          <br>
          <button class="usar-keeley" style="color: black; border: 2px solid goldenrod; background: transparent; font-weight: bold; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            ✔️ Sim
          </button>
          <br>
          <button class="usar-normal" style="color: black; border: 2px solid #3A8DFF; background: transparent; font-weight: bold; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            ❌ Não
          </button>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    whisper: [], // mensagem pública
    blind: false
  });

  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Mensagem criada no chat. Aguardando escolha do jogador...`);

  //====================
  // Bloco 3 - Espera pela resposta do jogador via clique nos botões
  //====================
  const escolha = await new Promise(resolve => {
    Hooks.once("renderChatMessage", async (_msg, html) => {
      // atualiza o ID da div para rastreio
      html.find('.hpdc-escolha-keeley[data-msg-id="pendente"]').attr("data-msg-id", msgEscolha.id);

      const seletor = `.hpdc-escolha-keeley[data-msg-id="${msgEscolha.id}"]`;
      const $div = html.find(seletor);
      if (!$div.length) {
        console.warn(`${prefixo} [solicitarConfirmacaoKeeley] Bloco da mensagem não encontrado no DOM.`);
        return;
      }

      // clique no botão "✔️ Sim"
      html.find(".usar-keeley").on("click", async () => {
        logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Jogador clicou em "Sim"`);
        await msgEscolha.delete();
        resolve(true); // jogador escolheu usar Keeley
      });

      // clique no botão "❌ Não"
      html.find(".usar-normal").on("click", async () => {
        logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Jogador clicou em "Não"`);
        await msgEscolha.delete();
        resolve(false); // jogador recusou Keeley
      });
    });
  });

  //====================
  // Bloco 4 - Finalização e retorno
  //====================
  logDebug(`${prefixo} [solicitarConfirmacaoKeeley] Caminho escolhido pelo jogador: ${escolha ? "Keeley" : "Normal"}`);
  return escolha;
}


//====================
// GinasioDoDano - Ginásio responsável por rerrolagem de dano
//====================
console.log(`${prefixo} Registrando jornada por kanto. Pedido de desafio por rota defensiva registrado, registrando ginásio do dano`);

async function GinasioDoDano(dadosKanto) {
  logDebug(`${prefixo} [GinasioDoDano] Iniciando ginásio de dano`);

  //====================
  // Bloco 1 - Verificação dos dados necessários
  //====================
  const ator = dadosKanto.pagante;
  const rolagemOriginal = dadosKanto.dadosMensagemOriginal?.rolls?.[0];

  if (!rolagemOriginal) {
    console.warn(`${prefixo} [GinasioDoDano] Rolagem original não encontrada. Abortando.`);
    return;
  }

  if (!ator) {
    console.warn(`${prefixo} [GinasioDoDano] Ator pagante não definido. Abortando.`);
    return;
  }

  logDebug(`${prefixo} [GinasioDoDano] Ator identificado: ${ator.name}`);

  //====================
  // Bloco 2 - Obter configuração atual de rerrolagem de dano
  //====================
  const configuracao = game.settings.get(mID, "HPdCNoDano");
  logDebug(`${prefixo} [GinasioDoDano] Configuração atual: ${configuracao}`);

  //====================
  // Bloco 3 - Executar rerrolagem
  //====================
  const totalOriginal = rolagemOriginal.total;
  logDebug(`${prefixo} [GinasioDoDano] Total original da rolagem: ${totalOriginal}`);

  const novaRolagem = await rolagemOriginal.reroll();
  const totalNovo = novaRolagem.total;
  logDebug(`${prefixo} [GinasioDoDano] Nova rolagem executada. Total novo: ${totalNovo}`);

  //====================
  // Bloco 4 - Determinar rolagem a ser usada com base na configuração e rota
  //====================
  let totalEscolhido = totalNovo;
  let corOriginal = "black";
  let corNovo = "black";

  if (configuracao === "Maior") {
    if (dadosKanto.rota === "Defensiva") {
      // Caminho defensivo → usa o menor dos valores
      totalEscolhido = Math.min(totalNovo, totalOriginal);
      logDebug(`${prefixo} [GinasioDoDano] Rota defensiva ativa. Usando menor entre ${totalOriginal} e ${totalNovo}: ${totalEscolhido}`);

      if (totalNovo > totalOriginal) corNovo = "gray";
      else corOriginal = "gray";
    } else {
      // Caminho tradicional → usa o maior dos valores
      totalEscolhido = Math.max(totalNovo, totalOriginal);
      logDebug(`${prefixo} [GinasioDoDano] Rota tradicional ativa. Usando maior entre ${totalOriginal} e ${totalNovo}: ${totalEscolhido}`);

      if (totalNovo < totalOriginal) corNovo = "gray";
      else corOriginal = "gray";
    }

  } else if (configuracao === "Novo") {
    // Sempre usa a nova rolagem
    totalEscolhido = totalNovo;
    corOriginal = "gray";
    logDebug(`${prefixo} [GinasioDoDano] Configuração 'Novo'. Usando nova rolagem: ${totalNovo}`);
  } else {
    console.warn(`${prefixo} [GinasioDoDano] Configuração desconhecida ou inválida: ${configuracao}`);
  }

  //====================
  // Bloco 5 - Atualizar dados para mensagem final
  //====================
  dadosKanto.novaRolagem = novaRolagem;
  dadosKanto.totalOriginal = totalOriginal;
  dadosKanto.totalNovo = totalNovo;
  dadosKanto.totalEscolhido = totalEscolhido;
  dadosKanto.rolagemFinal = novaRolagem;
  dadosKanto.corOriginal = corOriginal;
  dadosKanto.corNovo = corNovo;
  dadosKanto.tipoHPdCUsado = "HPdCNoDano";

  logDebug(`${prefixo} [GinasioDoDano] Finalizado com total escolhido: ${totalEscolhido}`);
}

//====================
// GinasioKeeley - Ginásio do Caminho Roubado
//====================
console.log(`${prefixo} Registrando jornada por kanto. Ginásio do dano registrado, registrando ginásio roubado`);

async function GinasioKeeley(dadosKanto) {
  logDebug(`${prefixo} [GinasioKeeley] Iniciando ginásio Keeley para ${dadosKanto.pagante?.name ?? "indefinido"}`);

  const ator = dadosKanto.pagante;
  const EhDefensivo = dadosKanto.rota === "Defensiva";

  // Captura a rolagem original da mensagem
  const rolagemOriginal = dadosKanto.dadosMensagemOriginal?.rolls?.[0];
  if (!rolagemOriginal) {
    console.warn(`${prefixo} [GinasioKeeley] Rolagem original não encontrada. Abortando execução.`);
    return;
  }

  const totalOriginal = rolagemOriginal._total;
  logDebug(`${prefixo} [GinasioKeeley] Total da rolagem original: ${totalOriginal}`);

  // Executa a nova rolagem com reroll
  const novaRolagem = await rolagemOriginal.reroll({ keep: "new" });


// Marca a rolagem como originada do Ginásio Keeley
novaRolagem.options ??= {};
novaRolagem.options.ginasioKeeley = true;

  // Dispara o hook do sistema PF2e
  Hooks.call("pf2e.reroll", dadosKanto.mensagem, {
    newRoll: novaRolagem,
    oldRoll: rolagemOriginal,
    heroPoint: false,
    keep: "new"
  });

  // Aplica lógica do HPdCMaior se ativado
  const totalNovo = novaRolagem._total;
  logDebug(`${prefixo} [GinasioKeeley] Nova rolagem executada: ${totalNovo}`);
  
  let totalEscolhido = totalNovo;
  let rolagemFinal = novaRolagem;
  let corOriginal = "gray";
  let corNovo = "black";

  if (window.HPdCMaior === true) {
    logDebug(`${prefixo} [GinasioKeeley] HPdCMaior está ativado. Comparando rolagens.`);

    // Se for rota defensiva → inverter: pegar o menor
    if (EhDefensivo) {
      totalEscolhido = Math.min(totalOriginal, totalNovo);
      logDebug(`${prefixo} [GinasioKeeley] Rota Defensiva + HPdCMaior: menor entre ${totalOriginal} e ${totalNovo} = ${totalEscolhido}`);
    } else {
      totalEscolhido = Math.max(totalOriginal, totalNovo);
      logDebug(`${prefixo} [GinasioKeeley] Rota Tradicional + HPdCMaior: maior entre ${totalOriginal} e ${totalNovo} = ${totalEscolhido}`);
    }

    corOriginal = (totalEscolhido === totalOriginal) ? "black" : "gray";
    corNovo = (totalEscolhido === totalNovo) ? "black" : "gray";
  }

  // Restaurar contexto original se necessário
  if (!dadosKanto.updatedFlags?.pf2e) dadosKanto.updatedFlags = { pf2e: {} };

  const flagsOriginais = dadosKanto.dadosMensagemOriginal?.flags?.pf2e ?? {};

  if (!dadosKanto.updatedFlags.pf2e.context?.type && flagsOriginais.context?.type === "attack-roll") {
    dadosKanto.updatedFlags.pf2e.context = foundry.utils.deepClone(flagsOriginais.context);
    logDebug(`${prefixo} [GinasioKeeley] Contexto de ataque restaurado.`);
  }

  if (!dadosKanto.updatedFlags.pf2e.origin && flagsOriginais.origin) {
    dadosKanto.updatedFlags.pf2e.origin = foundry.utils.deepClone(flagsOriginais.origin);
    logDebug(`${prefixo} [GinasioKeeley] Origem da rolagem restaurada.`);
  }

  // Finaliza e grava os resultados no objeto de dados
  dadosKanto.rolagemOriginal = rolagemOriginal;
  dadosKanto.novaRolagem = novaRolagem;
  dadosKanto.rolagemFinal = novaRolagem;
  dadosKanto.totalOriginal = totalOriginal;
  dadosKanto.totalNovo = totalNovo;
  dadosKanto.totalEscolhido = totalEscolhido;
  dadosKanto.corOriginal = corOriginal;
  dadosKanto.corNovo = corNovo;
  dadosKanto.usouRoubado10 = novaRolagem.options?.HPdCRoubado10 === true;

  logDebug(`${prefixo} [GinasioKeeley] Ginásio finalizado. totalEscolhido = ${totalEscolhido}, usouRoubado10 = ${dadosKanto.usouRoubado10}`);
}

//====================
// GinasioNormal - Ginásio padrão para rolagens D20
//====================
console.log(`${prefixo} Registrando jornada por kanto. Ginásio roubado registrado, registrando ginásio normal`);

async function GinasioNormal(dadosKanto) {
  logDebug(`${prefixo} [GinasioNormal] Iniciando ginásio Normal para ${dadosKanto.pagante?.name ?? "indefinido"}`);

  const ator = dadosKanto.pagante;
  const EhDefensivo = dadosKanto.rota === "Defensiva";
  const socket = socketlib.registerModule(mID);

  // Captura a rolagem original da mensagem
  const rolagemOriginal = dadosKanto.dadosMensagemOriginal?.rolls?.[0];
  if (!rolagemOriginal) {
    console.warn(`${prefixo} [GinasioNormal] Rolagem original não encontrada. Abortando execução.`);
    return;
  }

  const totalOriginal = rolagemOriginal.total;
  logDebug(`${prefixo} [GinasioNormal] Total da rolagem original: ${totalOriginal}`);

  // Executa nova rolagem com reroll
let novaRolagem;
let totalNovo;

if (EhDefensivo) {
  logDebug(`${prefixo} [GinasioNormal] Rota defensiva identificada — iniciando reroll via GM`);
  const payload = {
    rollData: rolagemOriginal.toJSON(),
    keep: "new"
  };
  logDebug(`${prefixo} [GinasioNormal] Payload de reroll enviado via socket:`, payload);

  const resultado = await socket.executeAsGM("executarRerollSimplesComoGM", payload);
  logDebug(`${prefixo} [GinasioNormal] Resposta recebida do socket:`, resultado);

  if (!resultado) {
    console.error(`${prefixo} [GinasioNormal] Erro: resultado nulo ou indefinido retornado do socket.`);
    return;
  }

  if (!resultado.novaRolagem) {
    console.error(`${prefixo} [GinasioNormal] Erro: resultado não contém 'novaRolagem'. Conteúdo recebido:`, resultado);
    return;
  }

  logDebug(`${prefixo} [GinasioNormal] Reconstruindo rolagem a partir do resultado`);
  novaRolagem = Roll.fromData(resultado.novaRolagem);

  logDebug(`${prefixo} [GinasioNormal] Rolagem reconstruída:`, novaRolagem);
  totalNovo = resultado.total;
  logDebug(`${prefixo} [GinasioNormal] Total da nova rolagem (via GM): ${totalNovo}`);
} else {
  logDebug(`${prefixo} [GinasioNormal] Rota tradicional — realizando reroll local`);
  novaRolagem = await rolagemOriginal.reroll({ keep: "new" });

  logDebug(`${prefixo} [GinasioNormal] Nova rolagem local concluída:`, novaRolagem);
  totalNovo = novaRolagem.total;
  logDebug(`${prefixo} [GinasioNormal] Total da nova rolagem (local): ${totalNovo}`);
}

  // Dispara o hook de reroll padrão do PF2e
if (EhDefensivo) {
  await socket.executeAsGM("dispararHookRerollComoGM", {
    mensagemId: dadosKanto.mensagem.id,
    novaRolagemData: novaRolagem.toJSON(),
    rolagemOriginalData: rolagemOriginal.toJSON(),
    keep: "new"
  });
  logDebug(`${prefixo} [GinasioNormal] Hook reroll disparado via GM.`);
} else {
  Hooks.call("pf2e.reroll", dadosKanto.mensagem, {
    newRoll: novaRolagem,
    oldRoll: rolagemOriginal,
    keep: "new"
  });
  logDebug(`${prefixo} [GinasioNormal] Hook reroll disparado localmente.`);
}

  // Lógica para HPdCMaior
  let totalEscolhido = totalNovo;
  let rolagemFinal = novaRolagem;
  let corOriginal = "gray";
  let corNovo = "black";

  if (window.HPdCMaior === true) {
    logDebug(`${prefixo} [GinasioNormal] HPdCMaior ativado.`);

    // Inverte comportamento na rota Defensiva
    if (EhDefensivo) {
      totalEscolhido = Math.min(totalOriginal, totalNovo);
      logDebug(`${prefixo} [GinasioNormal] Rota Defensiva → menor entre ${totalOriginal} e ${totalNovo} = ${totalEscolhido}`);
    } else {
      totalEscolhido = Math.max(totalOriginal, totalNovo);
      logDebug(`${prefixo} [GinasioNormal] Rota Tradicional → maior entre ${totalOriginal} e ${totalNovo} = ${totalEscolhido}`);
    }

    corOriginal = (totalEscolhido === totalOriginal) ? "black" : "gray";
    corNovo = (totalEscolhido === totalNovo) ? "black" : "gray";
  }

  // Atualiza dados no objeto dadosKanto
  dadosKanto.rolagemOriginal = rolagemOriginal;
  dadosKanto.novaRolagem = novaRolagem;
  dadosKanto.rolagemFinal = novaRolagem;
  dadosKanto.totalOriginal = totalOriginal;
  dadosKanto.totalNovo = totalNovo;
  dadosKanto.totalEscolhido = totalEscolhido;
  dadosKanto.corOriginal = corOriginal;
  dadosKanto.corNovo = corNovo;

  logDebug(`${prefixo} [GinasioNormal] Ginásio finalizado. totalEscolhido = ${totalEscolhido}`);
}

//====================
// montarEliteKanto - Bloco final que cria a nova mensagem com a rolagem escolhida
//====================
console.log(`${prefixo} Registrando jornada por kanto. Ginásio normal registrado, registrando elite dos 4`);

async function montarEliteKanto(dadosKanto) {
  logDebug(`${prefixo} [montarEliteKanto] Iniciando criação da mensagem final para ${dadosKanto.pagante?.name ?? "indefinido"}`);

  const nomeHPdC = window.nomeHPdC || "Hero Point da Casa";
  const iconeHPdC = window.iconeHPdC || logoP;
  const mensagem = dadosKanto.mensagem;
  const ator = dadosKanto.entradaMensagem.ator;
  const novaRolagem = dadosKanto.novaRolagem;
  const totalOriginal = dadosKanto.totalOriginal;
  const totalNovo = dadosKanto.totalNovo;
  const totalEscolhido = dadosKanto.totalEscolhido;
  const corOriginal = dadosKanto.corOriginal;
  const corNovo = dadosKanto.corNovo;
  const updatedFlags = foundry.utils.duplicate(mensagem.flags ?? {});
  const dadosMensagemOriginal = dadosKanto.dadosMensagemOriginal;
  const socket = socketlib.registerModule(mID);

//====================
// Bloco - Determinar a rolagem final interna com base no tipo e configuração
//====================

let rolagemFinal = dadosKanto.rolagemFinal; // fallback padrão
logDebug(`${prefixo} [montarEliteKanto] Determinando rolagemFinal com base no tipo e configurações.`);

// coleta o tipo de jogada e rota
const tipo = dadosKanto.contexto?.type;
const ehDefensiva = dadosKanto.rota === "Defensiva";

// configurações globais
const usarMaiorD20 = game.settings.get(mID, "HPdCMaior") === true;
const configDano = game.settings.get(mID, "HPdCNoDano");
const usarMaiorDano = configDano === "Maior";

// logs iniciais
logDebug(`${prefixo} [montarEliteKanto] Tipo de jogada: ${tipo}`);
logDebug(`${prefixo} [montarEliteKanto] Rota: ${dadosKanto.rota}`);
logDebug(`${prefixo} [montarEliteKanto] Configuração usarMaiorD20: ${usarMaiorD20}`);
logDebug(`${prefixo} [montarEliteKanto] Configuração HPdCNoDano: ${configDano}`);

const rolagemOriginal = dadosKanto.dadosMensagemOriginal?.rolls?.[0];

//====================
// Verificação para rolagens D20 (checks, ataque, spell attack)
//====================
if (rolagemFinal?.isD20) {
  if (usarMaiorD20) {
    logDebug(`${prefixo} [montarEliteKanto] Tipo D20 e usarMaiorD20 está ativo.`);

    const preferencia = ehDefensiva ? Math.min : Math.max;
    const totalPreferido = preferencia(totalOriginal, totalNovo);
    logDebug(`${prefixo} [montarEliteKanto] Comparando rolagens para D20: ${totalOriginal} vs ${totalNovo} → escolhido: ${totalPreferido}`);

    rolagemFinal = novaRolagem;
	rolagemFinal._total = totalEscolhido;
    logDebug(`${prefixo} [montarEliteKanto] Rolagem final definida como: ${(rolagemFinal === novaRolagem) ? "novaRolagem" : "rolagemOriginal"}`);
  }
}

//====================
// Verificação para rolagens de dano
//====================
else if (tipo === "damage-roll") {
  if (usarMaiorDano) {
    logDebug(`${prefixo} [montarEliteKanto] Tipo dano e usarMaiorDano está ativo.`);

    const preferencia = ehDefensiva ? Math.min : Math.max;
    const totalPreferido = preferencia(totalOriginal, totalNovo);
    logDebug(`${prefixo} [montarEliteKanto] Comparando rolagens para dano: ${totalOriginal} vs ${totalNovo} → escolhido: ${totalPreferido}`);

    rolagemFinal = novaRolagem;
    logDebug(`${prefixo} [montarEliteKanto] Rolagem final definida como: ${(rolagemFinal === novaRolagem) ? "novaRolagem" : "rolagemOriginal"}`);
  } else {
    logDebug(`${prefixo} [montarEliteKanto] Tipo dano mas usarMaiorDano está desativado (${configDano}).`);
  }
}

dadosKanto.rolagemFinal = rolagemFinal;
logDebug(`${prefixo} [montarEliteKanto] Rolagem final armazenada em dadosKanto.rolagemFinal`);
  
    const {
  speaker,
  whisper,
  blind,
  rollMode,
  sound,
  alias,
  timestamp,
  flavor: flavorOriginal,
} = dadosKanto.dadosMensagemOriginal;

  //====================
  // Flags de rerolagem
  //====================
  updatedFlags.pf2e = updatedFlags.pf2e ?? {};
  updatedFlags.pf2e.context = updatedFlags.pf2e.context ?? {};
  updatedFlags.pf2e.context.isReroll = true;
  updatedFlags.pf2e.context.oldTotal = totalOriginal;
  updatedFlags.pf2e.context.newTotal = totalNovo;
  updatedFlags.pf2e.context.chosenTotal = totalEscolhido;
  updatedFlags.iChooseRoll = { HPdCReRolagem: true };

  //====================
  // Renderiza a nova rolagem
  //====================
  const contentNovaRolagem = await novaRolagem.render();
  const tempNovaContainer = document.createElement('div');
  tempNovaContainer.innerHTML = contentNovaRolagem;

  // Marca bônus de Keeley se aplicado
  if (novaRolagem?.options?.HPdCRoubado10) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dadosKanto.dadosMensagemOriginal.flavor, "text/html");
    const modificadores = doc.querySelector(".tags.modifiers");
	const ehDefensiva = dadosKanto.rota === "Defensiva";
	const sinal = ehDefensiva ? "-" : "+";
	const cor = ehDefensiva ? "red" : "goldenrod";

    if (modificadores) {
      const spanBonus = document.createElement("span");
      spanBonus.className = "tag tag_transparent";
      spanBonus.textContent = `${sinal}${window.HPdCRBonus} ${nomeHPdC}`;
	  spanBonus.setAttribute("style", `color: ${cor};`);
      modificadores.appendChild(spanBonus);

      dadosKanto.dadosMensagemOriginal.flavor = doc.body.innerHTML;
      logDebug(`${prefixo} Bônus de Keeley +${window.HPdCRBonus} adicionado ao flavor.`);
    } else {
      console.warn(`${prefixo} Flavor não possui .tags.modifiers para injetar o bônus.`);
    }
  }

  // Colore a nova rolagem
  const novaDiceRoll = tempNovaContainer.querySelector('.dice-roll');
  if (novaDiceRoll) {
    const totalEl = novaDiceRoll.querySelector('.dice-total');
    if (totalEl) totalEl.style.color = corNovo;
  }

  //====================
  // Renderiza e estiliza a rolagem original
  //====================
  const contentOriginal = await rolagemOriginal.render();
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = contentOriginal;
  tempContainer.querySelectorAll('.dice-total-buttons').forEach(btn => btn.remove());
  tempContainer.querySelectorAll('.dice-formula, .dice-tooltip').forEach(el => el.remove());

  const diceRollElement = tempContainer.querySelector('.dice-roll');
  if (diceRollElement) {
    const totalEl = diceRollElement.querySelector('.dice-total');
    if (totalEl) totalEl.style.color = corOriginal;
  }

  const blocoOriginal = diceRollElement?.outerHTML || '';

  // Insere o bloco original visual na nova rolagem
  if (novaDiceRoll && blocoOriginal) {
    const tempWrapper = document.createElement('div');
    tempWrapper.innerHTML = blocoOriginal.trim();

    const elementoOriginal = tempWrapper.firstElementChild;
    const botoes = novaDiceRoll.querySelector('.dice-total-buttons');
    const totalEl = novaDiceRoll.querySelector('.dice-total');

    if (botoes) {
      novaDiceRoll.insertBefore(elementoOriginal, botoes);
    } else if (totalEl) {
      totalEl.parentNode.insertBefore(elementoOriginal, totalEl.nextSibling);
    } else {
      novaDiceRoll.appendChild(elementoOriginal);
    }
  }


//====================
// Atualiza o grau de sucesso se houver DC
//====================
const contexto = updatedFlags.pf2e.context;
logDebug(`${prefixo} [montarEliteKanto] Verificando necessidade de atualização do grau de sucesso`);
if (contexto?.dc?.value != null) {
  logDebug(`${prefixo} [montarEliteKanto] DC encontrada: ${contexto.dc.value}`);
  const dc = contexto.dc.value;
  const diff = totalEscolhido - dc;
  logDebug(`${prefixo} [montarEliteKanto] Diferença entre total e DC: ${totalEscolhido} - ${dc} = ${diff}`);

// Cálculo do novo grau de sucesso
let grauNumerico;

// calcula o grau com base na diferença
if (diff >= 10) grauNumerico = 3;            // criticalSuccess
else if (diff >= 0) grauNumerico = 2;         // success
else if (diff > -10) grauNumerico = 1;        // failure
else grauNumerico = 0;                        // criticalFailure

// aplica ajuste por rolagem natural do dado
const d20 = novaRolagem.terms?.[0]?.results?.[0]?.result;
if (d20 === 1) grauNumerico = Math.max(0, grauNumerico - 1);
if (d20 === 20) grauNumerico = Math.min(3, grauNumerico + 1);

// converte número para string correspondente
const grausChave = [
 "criticalFailure",
 "failure", "success",
 "criticalSuccess"
];

const novoResultado = grausChave[grauNumerico];
logDebug(`${prefixo} [montarEliteKanto] grau de sucesso: ${novoResultado}.`);

  logDebug(`${prefixo} [montarEliteKanto] Resultado determinado: ${novoResultado}`);
  updatedFlags.pf2e.context.outcome = novoResultado;

  const grausNumericos = {
    criticalSuccess: 3,
    success: 2,
    failure: 1,
    criticalFailure: 0
  };

// ajusta o texto de sucesso do flavor de acordo com o tipo de teste
const tipo = contexto?.type ?? "check";

const graus =
  tipo === "attack-roll"
    ? {
        criticalSuccess: "Critical Hit",
        success: "Success",
        failure: "Failure",
        criticalFailure: "Critical Miss"
      }
    : {
        criticalSuccess: "Critical Success",
        success: "Success",
        failure: "Failure",
        criticalFailure: "Critical Failure"
      };

logDebug(`${prefixo} [montarEliteKanto] Vocabulário de grau usado para tipo "${tipo}"`, graus);

// essa parte tenta localizar a string traduzida para o grau de sucesso usando a chave do sistema
const resultadoFormatado = game.i18n.localize(`PF2E.Check.Result.Degree.${novoResultado}`);

// se o resultado ainda for a chave ("PF2E.*"), usa o texto customizado do mapeamento `graus`
const resultadoTexto = resultadoFormatado.startsWith("PF2E.") ? graus[novoResultado] : resultadoFormatado;

logDebug(`${prefixo} [montarEliteKanto] Texto formatado para grau de sucesso: ${resultadoTexto}`);

// essa parte verifica se o flavor original contém a string "Result:" para saber se deve atualizar
if (dadosKanto.dadosMensagemOriginal.flavor.includes("Result:")) {
  logDebug(`${prefixo} [montarEliteKanto] Flavor original contém "Result:", iniciando substituição...`);

  // converte o flavor HTML em um DOM manipulável
  const parser = new DOMParser();
  const doc = parser.parseFromString(dadosKanto.dadosMensagemOriginal.flavor, "text/html");
  logDebug(`${prefixo} [montarEliteKanto] HTML atual do flavor (colapsado):`, doc.body.innerHTML);

  // localiza o bloco que representa o grau de sucesso
  const blocoResultado = doc.querySelector("div.result.degree-of-success");
  logDebug(`${prefixo} [montarEliteKanto] Bloco .degree-of-success encontrado? ${!!blocoResultado}`);

  if (blocoResultado) {
    // localiza o elemento <span> que mostra o grau atual
    const grauEl = blocoResultado.querySelector("span.success, span.failure, span.criticalSuccess, span.criticalFailure");
    logDebug(`${prefixo} [montarEliteKanto] Elemento de grau encontrado? ${!!grauEl}`);

    if (grauEl) {
      // substitui a classe e o texto pelo novo grau calculado
      grauEl.className = novoResultado;
      grauEl.textContent = resultadoTexto;
      logDebug(`${prefixo} [montarEliteKanto] Grau atualizado para ${novoResultado} (${resultadoTexto})`);
    }

    // localiza o elemento de diferença (ex: "by +5") e atualiza com o novo diff
	let diffEl = blocoResultado.querySelector("span[data-visibility]");
if (!diffEl) {
  diffEl = Array.from(blocoResultado.querySelectorAll("span"))
    .find(e => e.textContent?.trim().startsWith("by "));
}
    logDebug(`${prefixo} [montarEliteKanto] Elemento de diferença encontrado? ${!!diffEl}`);

    if (diffEl) {
      const sinal = diff >= 0 ? "+" : "";
      diffEl.textContent = `by ${sinal}${diff}`;
      logDebug(`${prefixo} [montarEliteKanto] Texto de diferença atualizado para: by ${sinal}${diff}`);
    }

    // atualiza a rolagem com o novo grau de sucesso para uso posterior
    novaRolagem.options ??= {};
    novaRolagem.options.outcome = novoResultado;
    novaRolagem.options.degreeOfSuccess = grausNumericos[novoResultado];

    // substitui o flavor HTML da mensagem com o novo DOM modificado
    dadosKanto.dadosMensagemOriginal.flavor = doc.body.innerHTML;
    logDebug(`${prefixo} [montarEliteKanto] Flavor substituído (colapsado):`, doc.body.innerHTML);

    // garante que a rolagem final contenha as opções atualizadas também
    dadosKanto.rolagemFinal.options ??= {};
    dadosKanto.rolagemFinal.options.outcome = updatedFlags.pf2e.context.outcome;

    logDebug(`${prefixo} Flavor atualizado com novo grau de sucesso: ${resultadoTexto}`);
  }
}
}

  //====================
  // Monta o conteúdo final e envia a nova mensagem
  //====================
const anotacao = `
  <div style="margin-top:4px; font-size:16px; display:inline-flex; align-items:center; gap:6px;">
    ${iconeHPdC.replace(/width="\d+"/, 'width="28"').replace(/height="\d+"/, 'height="28"')}
    <strong>${nomeHPdC}</strong>
  </div>`;

  const content = tempNovaContainer.innerHTML + anotacao;

  //deleta a mensagem original
  if (dadosKanto.rota === "Defensiva") {
  logDebug(`${prefixo} [montarEliteKanto] Rota defensiva ativa — delegando deleção via GM`);
  
  await socket.executeAsGM("deletarMensagem", mensagem.id);

} else {
  logDebug(`${prefixo} [montarEliteKanto] Rota tradicional — apagando mensagem localmente`);
  await mensagem.delete();
}
  logDebug(`${prefixo} Mensagem original removida: ${mensagem.id}`);

//====================
// Bloco: Criação da nova mensagem (via Socket se rota defensiva)
//====================
const conteudoMensagem = {
  speaker,
  flags: updatedFlags,
  rolls: [rolagemFinal],
  content,
  flavor: dadosKanto.dadosMensagemOriginal.flavor,
  type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  whisper,
  blind,
  rollMode,
  sound,
  alias,
  timestamp
};

if (dadosKanto.rota === "Defensiva") {
  logDebug(`${prefixo} [montarEliteKanto] Rota defensiva ativa — criando mensagem via socket (GM)`);

  await socket.executeAsGM("criarMensagemGenerica", conteudoMensagem);

  logDebug(`${prefixo} Mensagem final criada via GM para ${ator.name}`);
} else {
  logDebug(`${prefixo} [montarEliteKanto] Rota tradicional — criando mensagem localmente`);
  await ChatMessage.create(conteudoMensagem);
  logDebug(`${prefixo} Mensagem final criada para ${ator.name}`);
}

}

//====================
// encerrarKanto — Finaliza o uso do HPdC, tratando Consolação e decrementos
//====================
console.log(`${prefixo} Elite dos 4 registrada, Registrando fim da jornada`);

async function encerrarKanto(dadosKanto) {
  logDebug(`${prefixo} [encerrarKanto] Iniciando encerramento final para ${dadosKanto.pagante?.name ?? "desconhecido"}`);

  const ator = dadosKanto.pagante;

// Revalidação do valor de permanentes para rotas que consomem HPdCs antes da Consolação
if (dadosKanto.rota === "Defensiva") {
  const valorAtual = await ator.getFlag(mID, "heroPointsDaCasa") ?? 0;
  logDebug(`${prefixo} [Defensivo] Revalidando permanentes no início da função: ${dadosKanto.permanentes} → ${valorAtual}`);
  dadosKanto.permanentes = valorAtual;
}

  const permanentes = dadosKanto.permanentes ?? await ator.getFlag("i-choose-roll", "heroPointsDaCasa");
  const novoEhMaior = dadosKanto.totalEscolhido > dadosKanto.totalOriginal;
  const HPdCConsolacao = game.settings.get(mID, "HPdCConsolacao");

  //====================
  // Bloco: Espera Dice So Nice antes de verificar Consolação
  //====================
  const DSNAtivo = game.modules.get("dice-so-nice")?.active === true;

  if (DSNAtivo) {
    // se Dice So Nice estiver ativo, pega a última mensagem e espera animação terminar
    const ultimaMsg = game.messages.contents[game.messages.contents.length - 1];
    const idNovaMensagem = ultimaMsg?.id;
    logDebug(`${prefixo} [Consolação] Dice So Nice ativo. Aguardando animação para ${ator.name} (mensagem ${idNovaMensagem})`);

    Hooks.once("diceSoNiceRollComplete", async (id) => {
      if (id !== idNovaMensagem) return;
      logDebug(`${prefixo} [Consolação] Animação encerrada. Executando verificação de Consolação.`);
      await verificarConsolacaoOuDecrementar();
    });

  } else {
    // se Dice So Nice estiver desligado, executa imediatamente
    logDebug(`${prefixo} [Consolação] Dice So Nice desativado. Verificando imediatamente para ${ator.name}`);
    await verificarConsolacaoOuDecrementar();
  }

  //====================
  // Função interna — verifica se usa Consolação ou consome HPdC direto
  //====================
  async function verificarConsolacaoOuDecrementar() {
    logDebug(`${prefixo} [encerrarKanto] Iniciando verificação de Consolação e decremento.`);
	
//====================
// Bloco: Decremento de HPdCDefensivo
//====================

// busca o limite configurado para o uso defensivo
const limiteDef = game.settings.get(mID, "HPdCDfLimite");
logDebug(`${prefixo} [Defensivo] Limite configurado: ${limiteDef}`);

// verifica se a condição para decremento é válida: limite > 0 e rota defensiva usada
if (limiteDef > 0 && dadosKanto.rota === "Defensiva") {
  logDebug(`${prefixo} [Defensivo] Condição atendida. Rota: ${dadosKanto.rota}`);

  // captura o valor atual da flag antes da alteração
  const valorAnteriorDef = (await ator.getFlag(mID, "HPdCDefensivo"))?.atual ?? 0;

  // aplica o decremento direto
  const novoValorDef = Math.max(valorAnteriorDef - 1, 0);
  await ator.setFlag(mID, "HPdCDefensivo", { atual: novoValorDef });
  logDebug(`${prefixo} [Defensivo] Uso de HPdCDefensivo consumido: ${valorAnteriorDef} → ${novoValorDef} para ${ator.name}`);

  // coleta snapshot de todas as flags para o hook
  const flagsDef = {};
  for (const chave of chavesHPdC) {
    flagsDef[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
  }

  // dispara hook de mudança com os valores corretos
  logDebug(`${prefixo} [Defensivo] Disparando hook HPdCMudança para ${ator.name}`);
  Hooks.call("HPdCMudança", ator, {
    id: ator.id,
    antigo: valorAnteriorDef,
    novo: novoValorDef,
    flags: flagsDef
  });

} else {
  // se a condição não for atendida, registra e segue
  logDebug(`${prefixo} [Defensivo] Condição NÃO atendida. Nenhuma alteração feita para ${ator.name}`);
}

//====================
// Bloco: Decremento de HPdCRoubado
//====================

// busca o limite configurado para o uso Roubado
const limiteRoubado = game.settings.get(mID, "HPdCRLimite");
logDebug(`${prefixo} [Roubado] Limite configurado: ${limiteRoubado}`);

// verifica se a condição para decremento é válida: limite > 0 e bônus foi aplicado
if (limiteRoubado > 0 && dadosKanto.usouRoubado10 === true) {
  logDebug(`${prefixo} [Roubado] Condição atendida. Bônus foi aplicado.`);

  // captura o valor atual da flag antes da alteração
  const valorAnteriorRoubado = (await ator.getFlag(mID, "HPdCRoubado"))?.atual ?? 0;

  // aplica o decremento direto
  const valorNovoRoubado = Math.max(valorAnteriorRoubado - 1, 0);
  await ator.setFlag(mID, "HPdCRoubado", { atual: valorNovoRoubado });
  logDebug(`${prefixo} [Roubado] Uso de HPdCRoubado consumido: ${valorAnteriorRoubado} → ${valorNovoRoubado} para ${ator.name}`);

  // coleta snapshot de todas as flags para o hook
  const flagsRoubado = {};
  for (const chave of chavesHPdC) {
    flagsRoubado[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
  }

  // dispara hook de mudança com os valores corretos
  logDebug(`${prefixo} [Roubado] Disparando hook HPdCMudança para ${ator.name}`);
  Hooks.call("HPdCMudança", ator, {
    id: ator.id,
    antigo: valorAnteriorRoubado,
    novo: valorNovoRoubado,
    flags: flagsRoubado
  });

} else {
  // se a condição não for atendida, registra e segue
  logDebug(`${prefixo} [Roubado] Condição NÃO atendida. Nenhuma alteração feita para ${ator.name}`);
}

//====================
// Bloco: Decremento de HPdCNoDano
//====================

// busca o limite configurado para o uso NoDano
const limiteNoDano = game.settings.get(mID, "HPdCDLimite");
logDebug(`${prefixo} [NoDano] Limite configurado: ${limiteNoDano}`);

// verifica se a condição para decremento é válida: limite > 0 e ginásio DoDano usado
if (limiteNoDano > 0 && dadosKanto.nomeDoGinasio === "GinasioDoDano") {
  logDebug(`${prefixo} [NoDano] Condição atendida. Ginásio: ${dadosKanto.nomeDoGinasio}`);

  // captura o valor atual da flag antes da alteração
  const valorAnteriorDano = (await ator.getFlag(mID, "HPdCNoDano"))?.atual ?? 0;

  // aplica o decremento direto
  const valorNovoDano = Math.max(valorAnteriorDano - 1, 0);
  await ator.setFlag(mID, "HPdCNoDano", { atual: valorNovoDano });
  logDebug(`${prefixo} [NoDano] Uso de HPdCNoDano consumido: ${valorAnteriorDano} → ${valorNovoDano} para ${ator.name}`);

  // coleta snapshot de todas as flags para o hook
  const flagsDano = {};
  for (const chave of chavesHPdC) {
    flagsDano[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
  }

  // dispara hook de mudança com os valores corretos
  logDebug(`${prefixo} [NoDano] Disparando hook HPdCMudança para ${ator.name}`);
  Hooks.call("HPdCMudança", ator, {
    id: ator.id,
    antigo: valorAnteriorDano,
    novo: valorNovoDano,
    flags: flagsDano
  });

} else {
  // se a condição não for atendida, registra e segue
  logDebug(`${prefixo} [NoDano] Condição NÃO atendida. Nenhuma alteração feita para ${ator.name}`);
}

    const flagConsolacao = await ator.getFlag(mID, "HPdCConsolacao");
    const usosConsolacao = flagConsolacao?.atual ?? 0;
	const limiteConsolacao = game.settings.get(mID, "HPdCCLimite");
	const usoIlimitado = !Number.isFinite(limiteConsolacao) || limiteConsolacao <= 0;
	logDebug(`${prefixo} limiteConsolacao = ${limiteConsolacao}, usoIlimitado = ${usoIlimitado}, usos no personagem = ${usosConsolacao}`);

//====================
// Consolação desligada — consome HPdC normalmente
//====================
if (HPdCConsolacao !== true) {
  logDebug(`${prefixo} Consolação está desligada nas configurações.`);

  // registra o valor atual
  const antigo = permanentes;
  const novo = Math.max(permanentes - 1, 0);

  // grava a nova flag no ator
  await ator.setFlag(mID, "heroPointsDaCasa", novo);
  logDebug(`${prefixo} Hero Point da Casa consumido: ${antigo} → ${novo} para ${ator.name}`);

  // coleta todas as flags HPdC para o hook
  const todasAsFlags = {};
  for (const chave of chavesHPdC) {
    todasAsFlags[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
  }

  // dispara o hook para sincronia entre mestre e subordinado
  logDebug(`${prefixo} [Hook Automático] Disparando hook HPdCMudança (consolação desligada)`);
  Hooks.call("HPdCMudança", ator, {
    id: ator.id,
    antigo,
    novo,
    flags: todasAsFlags
  });

  return; // encerra aqui pois não há mais lógica a aplicar
}

//====================
// Consolação com uso ilimitado — nova rolagem foi pior
//====================
if (HPdCConsolacao === true && usoIlimitado && !novoEhMaior) {
  logDebug(`${prefixo} [Consolação] Modo ilimitado ativado e nova rolagem foi pior. Hero Point NÃO será consumido.`);
  return; // não consome HPdC
}

//====================
// Consolação com limite — exibe confirmação no chat
//====================
if (HPdCConsolacao === true && !novoEhMaior && !usoIlimitado && usosConsolacao > 0) {
  logDebug(`${prefixo} [Consolação] Confirmação será exibida para ${ator.name} (usos disponíveis: ${usosConsolacao})`);

  const msgEscolhaConsolacao = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: ator }),
    content: `
      <div class="hpdc-escolha-consolacao" data-msg-id="pendente">
        <p><strong style="font-size: 20px;">${iconeHPdC.replace(/width="\\d+"/, 'width="22"').replace(/height="\\d+"/, 'height="22"')} ${nomeHPdC}</strong><br><br>
        Deseja gastar 1 uso de Consolação para não perder o ${nomeHPdC}?</p>
        <div style="margin-top: 6px;">
          <br>
          <button class="usar-consolacao" style="color: black; border: 2px solid goldenrod; background: transparent; font-weight: bold; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            ✔️ Sim
          </button>
          <br>
          <button class="usar-sem-consolacao" style="color: black; border: 2px solid #3A8DFF; background: transparent; font-weight: bold; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
            ❌ Não
          </button>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    whisper: [],
    blind: false
  });

  const escolhaConsolacao = await new Promise(resolve => {
    Hooks.once("renderChatMessage", async (_msg, html) => {
      html.find('.hpdc-escolha-consolacao[data-msg-id="pendente"]').attr("data-msg-id", msgEscolhaConsolacao.id);

      const seletor = `.hpdc-escolha-consolacao[data-msg-id="${msgEscolhaConsolacao.id}"]`;
      const $div = html.find(seletor);
      if (!$div.length) {
        console.warn(`${prefixo} [Consolação] Mensagem não encontrada para ${ator.name}`);
        return;
      }

      const podeClicar = game.user.isGM || ator.testUserPermission(game.user, "OWNER");
      if (!podeClicar) {
        console.warn(`${prefixo} [Consolação] Usuário sem permissão para ${ator.name}`);
        return;
      }

      html.find(".usar-consolacao").on("click", async () => {
        await msgEscolhaConsolacao.delete();
        resolve("usar");
      });

      html.find(".usar-sem-consolacao").on("click", async () => {
        await msgEscolhaConsolacao.delete();
        resolve("nao-usar");
      });
    });
  });

  if (escolhaConsolacao === "usar") {
    const novoValor = Math.max(usosConsolacao - 1, 0);
    await ator.setFlag(mID, "HPdCConsolacao", { atual: novoValor });
    logDebug(`${prefixo} [Consolação] Uso consumido: ${usosConsolacao} → ${novoValor} para ${ator.name}`);

    const todasAsFlags = {};
    for (const chave of chavesHPdC) {
      todasAsFlags[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
    }

    logDebug(`${prefixo} [Hook Automático] Disparando hook HPdCMudança após uso de Consolação`);
    Hooks.call("HPdCMudança", ator, {
      id: ator.id,
      antigo: usosConsolacao,
      novo: novoValor,
      flags: todasAsFlags
    });

    return; // ❗ Não consome HPdC
  }

  // Se recusou usar Consolação → consome HPdC normalmente
  logDebug(`${prefixo} [Consolação] Jogador recusou Consolação. HPdC será consumido para ${ator.name}`);
}

    //====================
    // Bloco: Decremento do Hero Point da Casa
    //====================
    const antigo = permanentes;
    const novo = Math.max(permanentes - 1, 0);
    await ator.setFlag(mID, "heroPointsDaCasa", novo);
    logDebug(`${prefixo} Hero Point da Casa consumido: ${antigo} → ${novo} para ${ator.name}`);

    const todasAsFlags = {};
    for (const chave of chavesHPdC) {
      todasAsFlags[`flags.${mID}.${chave}`] = await ator.getFlag(mID, chave);
    }

    logDebug(`${prefixo} [Hook Automático] Disparando hook HPdCMudança após consumo do HPdC`);
    Hooks.call("HPdCMudança", ator, {
      id: ator.id,
      antigo,
      novo,
      flags: todasAsFlags
    });
  }
}
console.log(`${prefixo} Todos os registros feitos, boa jornada para os treinadores`);

//====================
// registro do menu de contexto
//====================
Hooks.once("init", () => {
	console.log(`${prefixo} Registrando opção no menu de contexto do chat usando libWrapper`);

	try {
		// Garante que libWrapper está disponível
		if (!game.modules.get("lib-wrapper")?.active) {
			ui.notifications.error(`${logo} libWrapper não está ativo — não foi possível registrar a opção de menu.`);
			console.error(`${prefixo} libWrapper não encontrado ou não ativo.`);
			return;
		}

		// Registra o wrapper no método do ChatLog
		libWrapper.register(mID, "foundry.applications.sidebar.tabs.ChatLog.prototype._getEntryContextOptions", function (wrapped) {
			console.log(`${prefixo} Wrapper do menu de contexto chamado`);

			// Obtém as opções já registradas pelo sistema e outros módulos
			const opcoes = wrapped.bind(this)();

			//====================
			// Adiciona opção Hero Point D20 padrão
			//====================
			opcoes.unshift({
				name: `Reroll using a House Rule Hero Point`,
				icon: ' ',

				// Condições para aparecer
				condition: li => {
					const msgId = li.dataset.messageId; //atualizado para v13
					const mensagem = game.messages.get(msgId);
					
					if (!mensagem?.rolls?.[0]) return false;
					
					let ator = mensagem?.actor;
					const defensivoAtivo = game.settings.get(mID, "HPdCDefensivo") !== "Desligado";
					const modoDefensivo = defensivoAtivo && !game.user.isGM && !ator?.isOwner && ator?.prototypeToken?.disposition === -1;
					
					if (modoDefensivo) {
						const personagens = game.actors.filter(a => a.type === "character" && a.testUserPermission(game.user, "OWNER"));
						const personagensValidos = game.settings.get(mID, "HPdCDfLimite") > 0
						? personagens.filter(p => (p.flags[mID]?.HPdCDefensivo?.atual ?? 0) > 0)
						: personagens;
						
						if (personagensValidos.length === 0) return false;
						
						// Substitui ator para todas as verificações subsequentes
						ator = personagensValidos[0]; // ou outro critério, se desejar
					}

					// Não gera opção se o HPdC for 0 ou nulo (tem precauções para nunca ser nulo, mas um pouco de redundância é bom.
					const hpdc = Number(ator.flags["i-choose-roll"]?.heroPointsDaCasa ?? 0);
					if (hpdc <= 0) return false;

					if (!ator) return false;
					
					const temD20 = mensagem.rolls[0].terms.some(t => t.faces === 20);
					const rolagemEhDano = mensagem?.flags?.pf2e?.context?.type === "damage-roll";
					const danoAtivo = game.settings.get(mID, "HPdCNoDano") !== "Desligado";
					
					if (rolagemEhDano) {
						// Verifica o limite de uso de HPdC para Dano, somente se o limite for maior que 0
						const limiteDano = window.HPdCDLimite;  // Pega o limite de dano (se não existir, retorna undefined)
						
						if (!limiteDano) return true;  // Se não houver limite, ignora a verificação
						if (limiteDano > 0) {
							const usoDano = ator.flags["i-choose-roll"]?.HPdCNoDano?.atual ?? 0;
							
							if (usoDano <= 0) {
								console.log(`[HPdC] Limite de dano alcançado para ${ator.name}, bloqueando opção.`);
								return false;
							}
						}
					}
					
					console.log(`[HPdC] temD20=${temD20}, rolagemEhDano=${rolagemEhDano}, danoAtivo=${danoAtivo}`);
					
					const tipoRequisito = window.HPdCRequizitoTipo;
					const slugRequisito = window.HPdCRequisitoSlug?.trim();
					let possui = true;
					
					if (tipoRequisito !== "nenhum") {
						if (tipoRequisito === "feat") {
							possui = ator.itemTypes.feat.some(f => f.slug === slugRequisito);
							
						} else if (tipoRequisito === "trait") {
							possui = ator.system.traits?.value?.includes(slugRequisito);
							
						} else if (tipoRequisito === "effect") {
							possui = ator.itemTypes.effect.some(e => e.slug === slugRequisito);
						}
					}
					
					console.log(`[HPdC] Pré-requisito para ${ator.name}: ${possui}`);
					
					return estaAtiva("ativarHeroPointDaCasa") && possui && (temD20 || (rolagemEhDano && danoAtivo));
				},

				// Define o que acontece ao clicar na opção
				callback: async li => {
					try {
						console.log(`${prefixo} Callback executado`);
						const msgId = li.dataset.messageId; //atualizado para v13
						const mensagem = game.messages.get(msgId);
						const ator = mensagem?.actor;

						if (!ator) {
							ui.notifications.warn(`${logo} Nenhum ator associado à rolagem.`);
							return;
						}
						
						await HPdCKanto(mensagem );

					} catch (e) {
						console.error(`${prefixo} Erro ao executar a ação do menu:`, e);
						ui.notifications.error(`${logo} Erro ao usar ${nomeHPdC}.`);
					}
				}
			});

			console.log(`${prefixo} Opção "Usar Hero Point da Casa" adicionada ao menu de contexto (v12+)`);
			return opcoes;
		}, "WRAPPER");

	} catch (e) {
		console.error(`${prefixo} Erro ao registrar a opção de menu com libWrapper:`, e);
		ui.notifications.error(`${logo} Erro ao registrar a opção de menu.`);
	}
});


//====================
// Hook - Sincronizar HPdC entre mestre e subordinado (UI e automações)
//====================

Hooks.on("HPdCMudança", sincronizarHPdC);
Hooks.on("HPdCMudançaUI", sincronizarHPdC);

async function sincronizarHPdC(ator, dados) {
	try {
		// verifica se o ator é válido e do tipo personagem
		if (!ator || ator.type !== "character") return;
		
		// garante que o ator participa do sistema de HPdC do Toolbelt
		const vinculo = await ator.getFlag(mID, "vinculoHPdC");
		if (!vinculo) return;
		
		logDebug(`${prefixo} Iniciando sincronia de HPdC para ${ator.name}`);
		
		// coleta os parceiros de sincronia (mestre ou subordinados)
		const parceiros = [];
		const { idMestre, subordinados = [] } = vinculo;
		
		if (subordinados.length > 0) {
			
			// adiciona todos os subordinados válidos
			for (const id of subordinados) {
				const alvo = game.actors.get(id);
				if (alvo?.type === "character") parceiros.push(alvo);
			}
			
		} else if (idMestre) {
			
			// adiciona o mestre se válido
			const mestre = game.actors.get(idMestre);
			if (mestre?.type === "character") parceiros.push(mestre);
		}
		
		// encerra se não houver ninguém para sincronizar
		if (parceiros.length === 0) return;
		
		// aplica a sincronia das flags nos parceiros
		for (const outro of parceiros) {
			const atualizacoes = {};
			
			for (const chave of chavesHPdC) {
				const caminho = `flags.${mID}.${chave}`;
				const novoValor = foundry.utils.getProperty(dados.flags ?? {}, caminho);
				
				if (novoValor !== undefined) {
					atualizacoes[caminho] = novoValor;
					logDebug(`${prefixo} Flag '${chave}' será sincronizada em ${outro.name}:`, novoValor);
				}
			}
			
			if (Object.keys(atualizacoes).length > 0) {
				logDebug(`${prefixo} Sincronizando HPdC de ${ator.name} para ${outro.name}`);
				await outro.update(atualizacoes, { iChooseRollSyncToolbelt: true });
			}
		}
		
	} catch (erro) {
		console.error(`${prefixo} Erro durante a sincronia de HPdC entre mestre e subordinado:`, erro);
	}
}

//====================
// Bloco - Injeta alvos como flag persistente em mensagens de dano após criação
//====================
Hooks.on("createChatMessage", async (msg, options, userId) => {
  logDebug(`${prefixo} [createChatMessage] Hook ativado para mensagem ${msg.id}`);

  // esse passo garante que apenas o cliente que criou a mensagem execute o restante
  if (game.user.id !== userId) {
    logDebug(`${prefixo} [createChatMessage] Ignorado neste cliente (não é o criador da mensagem).`);
    return;
  }
  
  try {
    // esse passo verifica se a mensagem é uma rolagem de dano
    const tipo = foundry.utils.getProperty(msg, "flags.pf2e.context.type");
    logDebug(`${prefixo} [createChatMessage] Tipo de rolagem detectado: ${tipo}`);

    if (tipo !== "damage-roll") {
      logDebug(`${prefixo} [createChatMessage] Mensagem ignorada — não é uma rolagem de dano.`);
      return;
    }

    // esse passo evita loop — verifica se a flag já está gravada
    if (msg.flags?.[mID]?.target) {
      logDebug(`${prefixo} [createChatMessage] Flag 'target' já presente. Ignorando.`);
      return;
    }

    // esse passo obtém o usuário responsável pela criação da mensagem
    const usuario = game.users.get(userId);
    logDebug(`${prefixo} [createChatMessage] Usuário responsável: ${usuario?.name ?? "desconhecido"}`);

    if (!usuario) {
      console.warn(`${prefixo} [createChatMessage] Usuário não encontrado. Abortando.`);
      return;
    }

    // esse passo coleta todos os alvos do usuário com ator válido
    const alvos = Array.from(usuario.targets)
      .filter(t => t?.actor)
      .map(t => ({
        actorId: t.actor.id,
        tokenId: t.id,
        name: t.name
      }));

    logDebug(`${prefixo} [createChatMessage] Alvos detectados:`, alvos.map(a => a.name));

    if (alvos.length === 0) {
      logDebug(`${prefixo} [createChatMessage] Nenhum alvo com ator detectado. Nada será gravado.`);
      return;
    }

    // esse passo grava a flag na mensagem, de forma persistente
    await msg.update({ [`flags.${mID}.target`]: alvos });
    logDebug(`${prefixo} [createChatMessage] Flag 'target' gravada com sucesso na mensagem ${msg.id}`);

  } catch (erro) {
    console.error(`${prefixo} [createChatMessage] Erro ao tentar gravar flag 'target' na mensagem:`, erro);
  }
});


//====================
// Hook para aplicar a Regra de Keeley (bônus ou penalidade no d20)
//====================
Hooks.on("pf2e.reroll", (mensagem, { newRoll, oldRoll }) => {

  // só reage se a rolagem foi disparada pelo Ginásio Keeley
  if (!newRoll?.options?.ginasioKeeley) return;

  logDebug(`${prefixo} [Hook Keeley] Rolagem recebida do Ginásio Keeley.`);

  // coleta o resultado do d20
  const resultado = newRoll.dice?.[0]?.results?.[0]?.result;
  logDebug(`${prefixo} [Hook Keeley] Resultado do d20: ${resultado}`);

  // lê as configurações atuais
  const limite = window.HPdCRDado;
  const bonus = window.HPdCRBonus;
  const ehDefensivo = newRoll.options?.rota === "Defensiva";

  logDebug(`${prefixo} [Hook Keeley] Limite configurado: ${limite}, Bônus configurado: ${bonus}`);
  logDebug(`${prefixo} [Hook Keeley] Rota atual: ${ehDefensivo ? "Defensiva" : "Tradicional"}`);

  //====================
  // ROTA DEFENSIVA
  //====================
  if (ehDefensivo) {
    // calcula o valor mínimo necessário para ativar a penalidade
    const minimoParaPenalidade = 21 - limite;
    logDebug(`${prefixo} [Hook Keeley] Valor mínimo para penalidade: ${minimoParaPenalidade}`);

    // aplica penalidade se o resultado for maior ou igual ao mínimo
    if (resultado >= minimoParaPenalidade) {
      newRoll.terms.push(
        foundry.dice.terms.OperatorTerm.fromData({ class: "OperatorTerm", operator: "+", evaluated: true }),
        foundry.dice.terms.NumericTerm.fromData({ class: "NumericTerm", number: -Math.abs(bonus), evaluated: true })
      );

      newRoll._total += -Math.abs(bonus);
      newRoll.options.HPdCRoubado10 = true;

      logDebug(`${prefixo} [Hook Keeley] Penalidade ${-Math.abs(bonus)} aplicada (resultado = ${resultado} ≥ ${minimoParaPenalidade})`);
    } else {
      logDebug(`${prefixo} [Hook Keeley] Penalidade NÃO aplicada (resultado = ${resultado} < ${minimoParaPenalidade})`);
    }

  //====================
  // ROTA TRADICIONAL
  //====================
  } else {
    // aplica bônus se o resultado for menor ou igual ao limite
    if (resultado <= limite) {
      newRoll.terms.push(
        foundry.dice.terms.OperatorTerm.fromData({ class: "OperatorTerm", operator: "+", evaluated: true }),
        foundry.dice.terms.NumericTerm.fromData({ class: "NumericTerm", number: Math.abs(bonus), evaluated: true })
      );

      newRoll._total += Math.abs(bonus);
      newRoll.options.HPdCRoubado10 = true;

      logDebug(`${prefixo} [Hook Keeley] Bônus +${Math.abs(bonus)} aplicado (resultado = ${resultado} ≤ ${limite})`);
    } else {
      logDebug(`${prefixo} [Hook Keeley] Bônus NÃO aplicado (resultado = ${resultado} > ${limite})`);
    }
  }

});