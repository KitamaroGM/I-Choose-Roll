//====================
// MacrosAutomaticas.js — Controle de formulário e execução de macros automáticas
//====================

console.log("I Choose Roll! [Macros Automáticas - Configuração] carregado");

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
// Funções para o formulário
//====================

//====================
// Função para Carregar os blocos já salvos
//====================
async function carregarBlocosMacros(html) {
	logDebug(`${prefixo} carregarBlocosMacros iniciado`);
	
	try {
		const listaSalva = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
		logDebug(`${prefixo} Lista de macros do usuário atual recuperada dos settings:`, { usuario: game.user.name, listaSalva });
		listaSalva.sort((a, b) => (a.posicao || 0) - (b.posicao || 0));
		logDebug(`${prefixo} Lista ordenada por posição:`, listaSalva.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
		
		const lista = html.find(".icr-macros-lista")[0];
		const template = html.find("#icr-template-macro")[0];
		
		if (!lista || !template) {
			console.warn(`${prefixo} Elementos básicos do formulário não encontrados.`);
			return;
		}
		
		for (const dados of listaSalva) {
			logDebug(`${prefixo} Processando macro salva:`, dados);
			
			const novoBloco = template.content.firstElementChild.cloneNode(true, true);
			
			// Preenche UUID ao salvar
			const campoUuid = novoBloco.querySelector("input[name='uuid']");
			
			if (campoUuid) campoUuid.value = dados.uuid;
			
			// Preenche nome acima do UUID
			const nomeDiv = novoBloco.querySelector(".nome-macro-salva");
			
			if (nomeDiv) {
				nomeDiv.textContent = dados.nome || "(sem nome)";
				nomeDiv.style.display = "block";
			}
			
			// Preenche switch
			const campoSwitch = novoBloco.querySelector("input[name='rodarNosJogadores']");
			if (campoSwitch) campoSwitch.checked = !!dados.rodarNosJogadores;
			
			// Ajusta botões para estado "pré-carregado"
			const botoesNovos = novoBloco.querySelector(".botoes-novos");
			const botoesPre = novoBloco.querySelector(".botoes-precarregados");
			
			if (botoesNovos && botoesPre) {
				botoesNovos.style.display = "none";
				botoesPre.style.display = "flex";
			}
			
			lista.appendChild(novoBloco);
			logDebug(`${prefixo} Bloco de macro pré-carregado adicionado à interface.`, novoBloco);
			novoBloco.dataset.posicao = dados.posicao;
			logDebug(`${prefixo} Bloco criado com dataset.posicao =`, novoBloco.dataset.posicao);
			
			// Instala ouvintes de Atualizar e Remover para blocos pré-carregados
			const botaoAtualizar = novoBloco.querySelector(".atualizar-macro");
			
			if (botaoAtualizar) {
				botaoAtualizar.addEventListener("click", async (ev) => {
					logDebug(`${prefixo} Botão 'Atualizar' clicado (pré-carregado).`);
					
					const bloco = ev.target.closest(".bloco-macro");
					const dados = await coletarDadosDoBloco(bloco);
					
					if (!dados?.ok) return;
					
					const listaAtual = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
					const posicaoBloco = parseInt(bloco.dataset.posicao, 10);
					logDebug(`${prefixo} Atualizando macro pré-carregada na posição`, posicaoBloco, "com dados:", dados);
					
					const novaLista = listaAtual.map(m => {
						
						if (m.posicao === posicaoBloco) {
							const atualizado = { ...m, uuid: dados.uuid, nome: dados.nome, rodarNosJogadores: dados.rodarNosJogadores }
							logDebug(`${prefixo} Macro na posição ${posicaoBloco} substituída:`, atualizado);
							return atualizado;
						}
						
						return m;
					});
					
					logDebug(`${prefixo} Lista após atualização (pré-carregada):`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
					
					// Força re-gravação, mesmo que os dados sejam idênticos
					logDebug(`${prefixo} Removendo flag iniciarMacrosLista antes da atualização (pré-carregada)...`);
					await game.user.unsetFlag(mID, "iniciarMacrosLista");
					logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso (pré-carregada).`);
					
					logDebug(`${prefixo} Gravando lista atualizada em iniciarMacrosLista (pré-carregada)...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
					await game.user.setFlag(mID, "iniciarMacrosLista", novaLista);
					logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso (pré-carregada).`);
					
					if (!game.user.isGM) {
						const socket = socketlib.registerModule(mID);
						socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
						
					} else {
						const socket = socketlib.registerModule(mID);
						socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
					}
					
					const nomeDiv = bloco.querySelector(".nome-macro-salva");
					
					if (nomeDiv) {
						nomeDiv.textContent = dados.nome || "(sem nome)";
						nomeDiv.style.display = "block";
					}
					
					ui.notifications.info(`${logo} Macro "${dados.nome}" atualizada.`);
				});
			}
			
			const botaoRemover = novoBloco.querySelector(".excluir-macro");
			
			if (botaoRemover) {
				
				botaoRemover.addEventListener("click", async (ev) => {
					logDebug(`${prefixo} Botão 'Remover' clicado (pré-carregado).`);
					
					const bloco = ev.target.closest(".bloco-macro");
					const dados = await coletarDadosDoBloco(bloco);
					
					if (!dados?.ok) return;
					
					const listaAtual = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
					const posicaoBloco = parseInt(bloco.dataset.posicao, 10);
					logDebug(`${prefixo} Removendo macro na posição`, posicaoBloco);
					
					let novaLista = listaAtual.filter(m => m.posicao !== posicaoBloco);
					logDebug(`${prefixo} Lista após remoção (antes de reorganizar):`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
					
					novaLista = reorganizarPosicoes(novaLista);
					logDebug(`${prefixo} Lista reorganizada:`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
					
					logDebug(`${prefixo} Removendo flag iniciarMacrosLista antes de gravar lista reorganizada...`);
					await game.user.unsetFlag(mID, "iniciarMacrosLista");
					logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso.`);
					
					logDebug(`${prefixo} Gravando lista reorganizada em iniciarMacrosLista...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
					await game.user.setFlag(mID, "iniciarMacrosLista", novaLista);
					logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso.`);
					
					if (!game.user.isGM) {
						const socket = socketlib.registerModule(mID);
						socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
						
					} else {
						const socket = socketlib.registerModule(mID);
						socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
					}
					
					bloco.remove();
					ui.notifications.info(`${logo} Macro "${dados.nome}" removida.`);
				});
			}
		}
		
	} catch (erro) {
		console.error(`${prefixo} Erro em carregarBlocosMacros:`, erro);
		ui.notifications.error(`${logo} Erro ao carregar macros automáticas salvas.`);
	}
}

//====================
// Função para Instalar os ouvintes para os blocos novos e pré carregados
//====================
function instalarOuvintesMacros(html) {
	logDebug(`${prefixo} instalarOuvintesMacros iniciado`);
	
	//Botão adicioanr
	const botaoAdicionar = html.find("#adicionar-macro")[0];
	const lista = html.find(".icr-macros-lista")[0];
	const template = html.find("#icr-template-macro")[0];
	
	// Botão recarregar
	const botaoRecarregar = html.find("#recarregar-clientes")[0];
	
	if (botaoRecarregar) {
		
		botaoRecarregar.addEventListener("click", async () => {
			logDebug(`${prefixo} Botão 'Recarregar Clientes' clicado pelo GM.`);
			const socket = socketlib.registerModule(mID);
			await socket.executeForEveryone("recarregarClientes");
			ui.notifications.warn(`${logo} Todos os clientes estão sendo recarregados!`);
		});
	}
	
	if (!botaoAdicionar || !lista || !template) {
		console.warn(`${prefixo} Elementos básicos não encontrados.`);
		return;
	}
	
	botaoAdicionar.addEventListener("click", () => {
		logDebug(`${prefixo} Botão '+' clicado`);
		const novoBloco = template.content.firstElementChild.cloneNode(true, true);
		lista.appendChild(novoBloco);
		
		//--------------------
		// Botões para novos blocos
		//--------------------
	
		// Botão Cancelar
		const botaoCancelar = novoBloco.querySelector(".cancelar-macro");
		
		if (botaoCancelar) {
			
			botaoCancelar.addEventListener("click", (ev) => {
				logDebug(`${prefixo} Botão 'Cancelar' clicado.`);
				const bloco = ev.target.closest(".bloco-macro");
				
				if (bloco) {
					bloco.remove();
					logDebug(`${prefixo} Bloco de macro removido da interface.`);
				}
			});
		}
		
		// Botão Salvar
		const botaoSalvar = novoBloco.querySelector(".salvar-macro");
		
		if (botaoSalvar) {
			
			botaoSalvar.addEventListener("click", async (ev) => {
				logDebug(`${prefixo} Botão 'Salvar' clicado.`);
				const bloco = ev.target.closest(".bloco-macro");
				const dados = await coletarDadosDoBloco(bloco);
				
				if (!dados?.ok) {
					logDebug(`${prefixo} Salvamento abortado — motivo: ${dados?.motivo}`, dados);
					return;
				}
				
				// Atualiza a lista do usuário no objeto de settings
				const listaAtual = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
				const maxPos = listaAtual.length > 0 ? Math.max(...listaAtual.map(m => m.posicao || 0)) : 0;
				dados.posicao = maxPos + 1;
				logDebug(`${prefixo} Nova macro recebida, atribuindo posição:`, { dados, maxPos });
				
				const novaLista = [...listaAtual, dados];
				logDebug(`${prefixo} Lista após adicionar nova macro:`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				
				logDebug(`${prefixo} Removendo flag iniciarMacrosLista antes de salvar nova macro...`);
				await game.user.unsetFlag(mID, "iniciarMacrosLista");
				logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso (Salvar).`);
				
				logDebug(`${prefixo} Gravando nova lista em iniciarMacrosLista (Salvar)...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				await game.user.setFlag(mID, "iniciarMacrosLista", novaLista);
				logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso (Salvar).`);
				
				bloco.dataset.posicao = dados.posicao;
				logDebug(`${prefixo} Bloco atualizado com dataset.posicao =`, bloco.dataset.posicao);
				
				// Se não for GM, expõe ao GM
				if (!game.user.isGM) {
					const socket = socketlib.registerModule(mID);
					socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
					
				// Se for GM, expõe a todos
				} else {
					const socket = socketlib.registerModule(mID);
					socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
				}
				
				// Preenche e exibe o nome acima do UUID
				const nomeDiv = bloco.querySelector(".nome-macro-salva");
				
				if (nomeDiv) {
					nomeDiv.textContent = dados.nome || "(sem nome)";
					nomeDiv.style.display = "block";
				}
				
				// Troca botões "Salvar/Cancelar" → "Atualizar/Remover"
				bloco.querySelector(".botoes-novos").style.display = "none";
				bloco.querySelector(".botoes-precarregados").style.display = "flex";
				logDebug(`${prefixo} Macro salva e interface atualizada.`, dados);
				ui.notifications.info(`${logo} Macro "${dados.nome}" salva com sucesso.`);
			});
		}
		
		logDebug(`${prefixo} Novo bloco de macro adicionado à lista`, novoBloco);
		
		//Botão Atualizar para novo bloco
		const botaoAtualizar = novoBloco.querySelector(".atualizar-macro");
		
		if (botaoAtualizar) {
			
			botaoAtualizar.addEventListener("click", async (ev) => {
				logDebug(`${prefixo} Botão 'Atualizar' clicado.`);
				
				const bloco = ev.target.closest(".bloco-macro");
				const dados = await coletarDadosDoBloco(bloco);
				
				if (!dados?.ok) {
					logDebug(`${prefixo} Atualização abortada — motivo: ${dados?.motivo}`, dados);
					return;
				}
				
				// Atualiza a lista do usuário atual no objeto de settings
				const listaAtual = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
				const posicaoBloco = parseInt(bloco.dataset.posicao, 10);
				logDebug(`${prefixo} Atualizando macro na posição`, posicaoBloco, "com dados:", dados);
				
				const novaLista = listaAtual.map(m => {
					
					if (m.posicao === posicaoBloco) {
						const atualizado = { ...m, uuid: dados.uuid, nome: dados.nome, rodarNosJogadores: dados.rodarNosJogadores };
						logDebug(`${prefixo} Macro na posição ${posicaoBloco} substituída:`, atualizado);
						return atualizado;
					}
					
					return m;
				});
				
				logDebug(`${prefixo} Lista após atualização:`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				
				// Força gravação, mesmo que os dados sejam idênticos novos blocos
				logDebug(`${prefixo} Removendo flag iniciarMacrosLista antes da atualização...`);
				await game.user.unsetFlag(mID, "iniciarMacrosLista");
				logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso.`);
				
				logDebug(`${prefixo} Gravando nova lista em iniciarMacrosLista...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				await game.user.setFlag(mID, "iniciarMacrosLista", novaLista);
				logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso.`);
				
				if (!game.user.isGM) {
					const socket = socketlib.registerModule(mID);
					socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
					
				} else {
					const socket = socketlib.registerModule(mID);
					socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
				}
				
				// Atualiza o nome visível acima do UUID
				const nomeDiv = bloco.querySelector(".nome-macro-salva");
				
				if (nomeDiv) {
					nomeDiv.textContent = dados.nome || "(sem nome)";
					nomeDiv.style.display = "block";
				}
				
				logDebug(`${prefixo} Macro atualizada com sucesso.`, dados);
				ui.notifications.info(`${logo} Macro "${dados.nome}" atualizada.`);
			});
		}
		
		// Botão Remover novos blocos
		const botaoRemover = novoBloco.querySelector(".excluir-macro");
		
		if (botaoRemover) {
			
			botaoRemover.addEventListener("click", async (ev) => {
				logDebug(`${prefixo} Botão 'Remover' clicado.`);
				const bloco = ev.target.closest(".bloco-macro");
				const dados = await coletarDadosDoBloco(bloco);
				
				if (!dados?.ok) {
					logDebug(`${prefixo} Remoção abortada — motivo: ${dados?.motivo}`, dados);
					return;
				}
				
				// Remove da lista do usuário atual no objeto de settings
				const listaAtual = await game.user.getFlag(mID, "iniciarMacrosLista") || [];
				
				const posicaoBloco = parseInt(bloco.dataset.posicao, 10);
				logDebug(`${prefixo} Removendo macro na posição`, posicaoBloco);
				
				let novaLista = listaAtual.filter(m => m.posicao !== posicaoBloco);
				logDebug(`${prefixo} Lista após remoção (antes de reorganizar):`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				
				novaLista = reorganizarPosicoes(novaLista);
				logDebug(`${prefixo} Lista reorganizada:`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				
				logDebug(`${prefixo} Removendo flag iniciarMacrosLista antes de gravar lista reorganizada...`);
				await game.user.unsetFlag(mID, "iniciarMacrosLista");
				logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso.`);
				
				logDebug(`${prefixo} Gravando lista reorganizada em iniciarMacrosLista...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
				await game.user.setFlag(mID, "iniciarMacrosLista", novaLista);
				logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso.`);
				
				if (!game.user.isGM) {
					const socket = socketlib.registerModule(mID);
					socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
					
				} else {
					const socket = socketlib.registerModule(mID);
					socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
				}
				
				// Remove da interface
				bloco.remove();
				logDebug(`${prefixo} Macro removida da lista e interface.`, dados);
				ui.notifications.info(`${logo} Macro "${dados.nome}" removida.`);
			});
		}
	});
}

//====================
// Função para validar blocos antes de salvar/atualizar a flag
//====================
async function coletarDadosDoBloco(bloco) {
	logDebug(`${prefixo} coletarDadosDoBloco iniciado`, bloco);
	
	const uuid = bloco.querySelector("input[name='uuid']")?.value?.trim() ?? "";
	
	if (!uuid) {
		const motivo = "Nenhum UUID informado.";
		ui.notifications.error(`${prefixo} ${motivo}`);
		return { ok: false, motivo, uuid: "" };
	}
	
	let macro = null;
	
	try {
		macro = await fromUuid(uuid);
		
	} catch (erro) {
		const motivo = `Erro ao resolver UUID: ${erro.message}`;
		logDebug(`${prefixo} ${motivo}`, erro);
		ui.notifications.error(`${prefixo} ${motivo}`);
		return { ok: false, motivo, uuid };
	}
	
	if (!macro) {
		const motivo = "Macro não encontrada para o UUID informado.";
		ui.notifications.error(`${prefixo} ${motivo}`);
		return { ok: false, motivo, uuid };
	}
	
	const nome = macro.name ?? "(sem nome)";
	const rodarNosJogadores = !!(bloco.querySelector("input[name='rodarNosJogadores']")?.checked);
	const dados = { ok: true, nome, uuid, rodarNosJogadores };
	logDebug(`${prefixo} Objeto de dados coletado com sucesso:`, dados);
	
	return dados;
}

//====================
//Função que atualiza as flags (socket)
//====================
 async function atualizarFlagMacros(userName, listaMacros) {
	 logDebug(`${prefixo} atualizarFlagMacros iniciado`, { userName, listaMacros });
	 
	try {
		const listaAtual = await game.users.getName(userName)?.getFlag(mID, "iniciarMacrosLista") || [];
		let novaLista = [...listaAtual, ...listaMacros];
		novaLista = reorganizarPosicoes(novaLista);
		logDebug(`${prefixo} Lista após merge e reorganização:`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
		
		const usuario = game.users.getName(userName);
		
		if (!usuario) {
			console.error(`${prefixo} Usuário não encontrado para atualizar flag:`, userName);
			return;
		}
		
		logDebug(`${prefixo} Removendo flag iniciarMacrosLista do usuário ${userName} antes de atualizar...`);
		await usuario.unsetFlag(mID, "iniciarMacrosLista");
		logDebug(`${prefixo} Flag iniciarMacrosLista removida com sucesso do usuário ${userName}.`);
		
		logDebug(`${prefixo} Gravando nova lista em iniciarMacrosLista para usuário ${userName}...`, novaLista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
		await usuario.setFlag(mID, "iniciarMacrosLista", novaLista);
		logDebug(`${prefixo} Flag iniciarMacrosLista gravada com sucesso para usuário ${userName}.`);
		
		if (game.user.isGM) {
			const socket = socketlib.registerModule(mID);
			socket.executeForEveryone("receberListaDoGM", { gmId: game.user.id, lista: novaLista });
		
		} else {
			const socket = socketlib.registerModule(mID);
			socket.executeAsGM("receberListaDoPlayer", { userId: game.user.id, lista: novaLista });
		}
		
	} catch (erro) {
		console.error(`${prefixo} Erro em atualizarFlagMacros:`, erro);
		ui.notifications.error(`${logo} Erro ao atualizar lista de macros automáticas.`);
	}
}

//====================
// Função para reorganizar as posições após apagar
//====================
function reorganizarPosicoes(lista) {
	logDebug(`${prefixo} [reorganizarPosicoes] Lista recebida:`, lista.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
	
	const listaOrdenada = [...lista].sort((a, b) => a.posicao - b.posicao);
	logDebug(`${prefixo} [reorganizarPosicoes] Lista ordenada:`, listaOrdenada.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
	
	const listaReorganizada = listaOrdenada.map((item, idx) => {
		const atualizado = { ...item, posicao: idx + 1 };
		logDebug(`${prefixo} [reorganizarPosicoes] Item ajustado:`, atualizado);
		return atualizado;
	});
	
	logDebug(`${prefixo} [reorganizarPosicoes] Lista final reorganizada:`, listaReorganizada.map(m => ({ nome: m.nome, posicao: m.posicao, uuid: m.uuid })));
	return listaReorganizada;
}

//====================
// Expor funções no namespace do módulo
//====================
if (!globalThis[mID]) globalThis[mID] = {};
globalThis[mID].MacrosAutomaticasConfig = {
  carregarBlocosMacros,
  instalarOuvintesMacros,
  coletarDadosDoBloco,
  atualizarFlagMacros
};