//====================
// MacrosAutomaticasExec.js — Controle de formulário e execução de macros automáticas
//====================

console.log("I Choose Roll! [Macros Automáticas - Execução] carregado");

const prefixo = "I Choose Roll! [Macros Automáticas]";
const mID = "i-choose-roll";
const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle;margin:0 4px 0 0;display:inline-block;">`;

//====================
// Funções utilitárias
//====================

// Define Log para Debug
const logDebug = (...args) => {
	const debugAtivo = game.settings.get("i-choose-roll", "modoDebug");
	
	if (debugAtivo === true) {
		console.log(...args);
	}
};

// Função para mensagens de debug que são enviadas ao chat
const mensagemDebug = (...args) => {
	const debugAtivo = game.settings.get("i-choose-roll", "modoDebug");
	
	if (debugAtivo === true) {
		ChatMessage.create({ content: args.join(" ") });
	}
};

//====================
// Funções para execução automática
//====================

// Chamado no ready: monta lista final com regras GM/Player e guarda em memória
async function prepararExecucaoMacros() {
	logDebug(`${prefixo} prepararExecucaoMacros iniciado`);
	
	try {
		const listaLocal = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
		
		// Zera a lista em memória
		window.icrMacrosExecutar = [];
		
		// 1. Se o usuário não for GM, incluir também macros dos GMs marcadas para rodar nos jogadores
		if (!game.user.isGM) {
			
			for (const gm of game.users.filter(u => u.isGM)) {
				const listaGM = await gm.getFlag(mID, "iniciarMacrosLista") || window.icrListaGM || [];
				
				for (const dados of listaGM) {
					if (!dados?.uuid) continue;
					if (!dados.rodarNosJogadores) continue;
					window.icrMacrosExecutar.push({ nome: dados.nome, uuid: dados.uuid, origem: "gm" });
					logDebug(`${prefixo} Preparada (gm):`, { gm: gm.name, nome: dados.nome, uuid: dados.uuid });
				}
			}
		}
		
		// 2. Sempre incluir as macros do próprio usuário
		for (const dados of listaLocal) {
			if (!dados?.uuid) continue;
			window.icrMacrosExecutar.push({ nome: dados.nome, uuid: dados.uuid, origem: "local" });
			logDebug(`${prefixo} Preparada (local):`, { nome: dados.nome, uuid: dados.uuid });
		}
		
		//3. Se for GM, também incluir macros dos outros GMs
		if (game.user.isGM) {
			
			for (const gm of game.users.filter(u => u.isGM)) {
				if (gm.id === game.user.id) continue; // <-- Proteção para não duplicar a própria lista
				const listaGM = await gm.getFlag(mID, "iniciarMacrosLista") || [];
				
				for (const dadosGM of listaGM) {
					if (!dadosGM?.uuid) continue;
					if (!dadosGM.rodarNosJogadores) continue;
					window.icrMacrosExecutar.push({ nome: dadosGM.nome, uuid: dadosGM.uuid, origem: "gm" });
					logDebug(`${prefixo} Preparada (outro GM):`, { gm: gm.name, nome: dadosGM.nome, uuid: dadosGM.uuid })
				}
			}
		}
		
		logDebug(`${prefixo} Total de macros preparadas: ${window.icrMacrosExecutar.length}`, window.icrMacrosExecutar);
		
	} catch (erro) {
		console.error(`${prefixo} Erro em prepararExecucaoMacros:`, erro);
		ui.notifications.error(`${logo} Erro ao preparar macros automáticas para execução.`);
	}
}

//====================
// Executa as macros da lista salva
//====================
function executarMacrosSalvas() {
	logDebug(`${prefixo} executarMacrosSalvas iniciado`);
	
	try {
		
		setTimeout(async () => {
			const lista = window.icrMacrosExecutar || [];
			
			if (!Array.isArray(lista) || lista.length === 0) {
				logDebug(`${prefixo} Nenhuma macro preparada para execução.`);
				return;
			}
			
			logDebug(`${prefixo} Iniciando execução automática de macros.`, lista);
			
			for (let i = 0; i < lista.length; i++) {
				const entrada = lista[i];
				
				try {
					const macro = await fromUuid(entrada.uuid);
					
					if (macro) {
						await macro.execute();
						logDebug(`${prefixo} Macro executada:`, { nome: entrada.nome, uuid: entrada.uuid, origem: entrada.origem });
						
					} else {
						console.warn(`${prefixo} Macro não encontrada:`, entrada.uuid);
					}
					
				} catch (erro) {
					console.error(`${prefixo} Erro executando macro:`, { nome: entrada.nome, uuid: entrada.uuid, origem: entrada.origem, erro });
				}
				
				await new Promise(r => setTimeout(r, 300)); // Espera 0.3s para executar a próxima macro
			}
		}, 3000); // Espera 3s antees de começar a executar as macros
		
	} catch (erro) {
		console.error(`${prefixo} Erro em executarMacrosSalvas:`, erro);
		ui.notifications.error(`${logo} Erro ao executar macros automáticas.`);
	}
}

//====================
// Expor funções no namespace do módulo
//====================
if (!globalThis[mID]) globalThis[mID] = {};
globalThis[mID].MacrosAutomaticasExec = {
  prepararExecucaoMacros,
  executarMacrosSalvas
};

//====================
// Hooks principais
//====================
Hooks.once("ready", prepararExecucaoMacros);
Hooks.once("canvasReady", executarMacrosSalvas);