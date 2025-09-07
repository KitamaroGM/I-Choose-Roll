//====================
// Configuracoes.js — Configurações do módulo I Choose Roll! com suporte a recarregamento condicional
//====================

// Log inicial para rastreio
console.log(`I Choose Roll! [Configurações] carregado — inicializando variáveis e constantes`);

//====================
// Bloco 0 - Constantes do Projeto
//====================

const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle;margin:0 4px 0 0;display:inline-block;">`;
const logoP = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="28" height="28" style="vertical-align:middle; margin:0 4px 0 0;display:inline-block;">`;
const logoPP = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="16" height="16" style="vertical-align:middle; margin:0 4px 0 0;display:inline-block;">`;
const prefixo = "I Choose Roll! [Configurações]";
const mID = "i-choose-roll";
let iconeHPdC = logoP;
let nomeHPdC = "Hero Point da Casa";
const CHPdC = "Hero Point da Casa";

//====================
// Função para modo debug
//====================
console.log(`I Choose Roll! [Configurações] Registrando logDebug`);
function debugLigado() {
  return game.settings.get("i-choose-roll", "modoDebug") === true;
}

function logDebug(...args) {
  if (debugLigado()) console.log(...args);
}

//====================
// Bloco 1 - Tabela de opções que exigem recarregamento
//====================
const opcoesComRecarregar = new Set([
    "ativarHeroPointDaCasa"  // Atual: apenas esta
]);

//====================
// Função utilitária para verificar se uma opção está ativa
//====================
export function estaAtiva(chave) {
	const valor = game.settings.get(mID, chave);
	console.log(`${prefixo} Verificando opção [${chave}]: ${valor}`);
	return valor;
}

//====================
// Bloco 2 - Registro das opções no hook ready
//====================
Hooks.once("init", () => {
	console.log(`${prefixo} Registrando opções no Foundry.`);
	
	//====================
	// Bloco 2.1 - Modo Debug
	//====================
	console.log(`${prefixo} Registrando modo debug do módulo "I Choose Roll!".`);
	
	game.settings.register(mID, "modoDebug", {
		name: "Modo Debug",
		hint: "Ativa logs e rastreamento detalhado para desenvolvimento e testes.",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [modoDebug] alterada para`, valor);
		}
	});
	//====================
	// Bloco 2.2 - Botão para abrir configurações avançadas do Hero Point da Casa (sem template por enquanto)
	//====================
	
	// Essa parte registra o botão no painel de Configurações do Mundo
	console.log(`${prefixo} Registrando botão para configurações avançadas do ${CHPdC}.`);
	
	game.settings.registerMenu(mID, 'menuConfiguracoesHPdC', {
		name: 'Hero Point da Casa', 
		label: 'Abrir Configurações', 
		hint: 'Clique para abrir as opções avançadas do Hero Point da Casa.', 
		icon: '<i class="fas fa-dice-d20"></i>', // Essa parte define o ícone do botão (FontAwesome)
		type: ClasseFormularioHPdC, 
		restricted: true // Essa parte limita o acesso apenas ao GM
	});
	
	// Registro de Hero Point da Casa
	console.log(`${prefixo} Registrando ativação de ${CHPdC}.`);
	
	registrarOpcao({
		chave: "ativarHeroPointDaCasa",
		nome: "Ativar Hero Point da Casa",
		dica: "Ativa a funcionalidade de Hero Point da Casa. É necessário recarregar o Foundry para aplicar.",
		padrao: true,
		precisaRecarregar: true
	});
	
//====================
// Bloco 2.3 - Botão para abrir configurações de Macros Automáticas
//====================
console.log(`${prefixo} Registrando botão para configurações de Macros Automáticas.`);

game.settings.registerMenu(mID, "menuMacrosAutomaticas", {
	name: "Macros Automáticas",
	label: "Abrir Configurações",
	hint: "Configure quais macros devem iniciar automaticamente quando o mundo carregar.",
	icon: "<i class='fas fa-play'></i>",
	type: ClasseFormularioMacrosAutomaticas,
	restricted: false
});

// Registro da lista de macros automáticas
game.settings.register(mID, "iniciarMacrosLista", {
	name: "Lista de Macros Automáticas",
	hint: "Armazena as macros configuradas para execução automática.",
	scope: "world",
	config: false,
	type: Array,
	default: []
});

	// Campo para definir um ícone personalizado para o HPdC
	console.log(`${prefixo} HPdC registrado, registrando URL de icone de HPdC.`)
	
	game.settings.register(mID, "iconeHPdC", {
		name: "Imagem personalizada do Hero Point da Casa",
		hint: "Insira a URL de uma imagem que será usada como ícone do Hero Point da Casa na ficha e no menu. Se deixar vazio, será usada a logo incrível do módulo.",
		scope: "world",
		config: false,
		type: String,
		default: "",
		
		onChange: () => {
			let novoIcone = game.settings.get(mID, "iconeHPdC")?.trim();
			
			if (novoIcone) {
				iconeHPdC = `<img src="${novoIcone}" alt="iconeHPdC" width="28" height="28" style="vertical-align:middle; margin-right:6px;">`;
			
			} else {
				iconeHPdC = logoP;
			}
			window.iconeHPdC = iconeHPdC; // <- deixa a variavel iconeHPdC global
			console.log(`${prefixo} iconeHPdC atualizado para:`, iconeHPdC);
		}
	});
	
	console.log(`${prefixo} URL de icone de HPdC registrada, registrando nome personalizado de HPdC.`)
	
	// Campo para definir o nome personalizado do HPdC
	game.settings.register(mID, "nomeHPdC", {
		name: "Nome personalizado do Hero Point da Casa",
		hint: "Insira um nome para substituir 'Hero Point da Casa'. Se deixar vazio, será usado 'Hero Point da Casa'.",
		scope: "world",
		config: false,
		type: String,
		default: "",
		
		onChange: () => {
			nomeHPdC = game.settings.get(mID, "nomeHPdC")?.trim() || "Hero Point da Casa";
			window.nomeHPdC = nomeHPdC;
			console.log(`${prefixo} nomeHPdC atualizado para:`, nomeHPdC);
		}
	});
	
	// Define o valor max de HPdC
	console.log(`${prefixo} Registrando quantidade máxima para ${CHPdC}.`);
	
	game.settings.register(mID, "valorHPdC", {
		name: "Valor Máximo de Hero Points da Casa",
		hint: "Define o valor máximo de Hero Points da Casa que um personagem pode ter.",
		scope: "world",
		config: false,
		type: Number,
		default: 3,
		
		onChange: valor => {
			
			// Pega o valor máximo de HPdC e armazena na variável global
			window.valorHPdC = game.settings.get(mID, "valorHPdC");
			console.log(`${prefixo} Opção [valorHPdC] alterada para [${valor}]`);
		}
	});
	
	// Marca se HPdC são adicionais ou não
	console.log(`${prefixo} Registrando opção para ${CHPdC} adicional.`);
	
	game.settings.register(mID, "heroPointsDaCasaAdicional", {
		name: "Hero Points da Casa Adicional",
		hint: "Quando marcado, os Hero Points da Casa são tratados como um recurso adicional ao Hero Point normal.",
		scope: "world",
		config: false,
		type: Boolean,
		default: true,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [heroPointsDaCasaAdicional] alterada para [${valor}]`);
		}
	});
	
	// Marca se HPdC pode ser usado no dano
	console.log(`${prefixo} Registrando opção para ${CHPdC} ser usado no dano.`);
	
	game.settings.register(mID, "HPdCNoDano", {
		name: "Hero Point da Casa no Dano",
		hint: "Quando marcado, os Hero Points da Casa poderão ser usados para rerolar o dano.",
		scope: "world",
		config: false,
		type: String,
		default: "Desligado",
		
		choices: {
			"Desligado": "Desligado",
			"Novo": "Novo valor",
			"Maior": "Maior valor"
		},
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCNoDano] alterada para [${valor}]`);
		}
	});
	
	// Permitir usar HPdC em inimigos 
	console.log(`${prefixo} Registrando uso defensivo do ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCDefensivo", {
		name: "Hero Point da Casa defensivo",
		hint: "Permite usar o Hero Point da Casa para forçar inimigos a re-rolarem.",
		scope: "world",
		config: false,
		type: String,
		default: "Desligado",
		
		choices: {
			"Desligado": "Desligado",
			"Ataque": "Ataque",
			"Save": "Salva Guarda",
			"Dano": "Dano",
			"Ambos": "Ataque e Salva Guarda",
			"AtaqueEDano": "Ataque e Dano",
			"SaveEDano": "Salva Guarda e Dano",
			"Todos": "Todos"
		},
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCDefensivo] alterada para [${valor}]`);
		}
	});
	
	// configuração para adicioanr a regra Keeley's ao HPdC
	console.log(`${prefixo} Registrando uso roubado do ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCRoubado", {
		name: "Keeley's Hero Point Ruler",
		hint: "Se a nova rolagem do dado for 10 ou menos, adiciona +10 a rolagem.",
		scope: "world",
		config: false,
		type: Boolean,
		default: false,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCRoubado] alterada para [${valor}]`);
		}
	});
	
	// Valor Máximo do Dado para Adicção do Bonus HPdCRoubado
	console.log(`${prefixo} Registrando valor da proporção do dado para ${CHPdC} usar o ginásio roubado.`);
	
	game.settings.register(mID, "HPdCRDado", {
		name: "Valor Máximo de Adição",
		hint: "Define o valor máximo que pode ser adicionado ao reroll usando o Hero Point da Casa.",
		scope: "world",
		config: false,  // Para que apareça nas configurações de configurações avançadas
		type: Number,
		default: 10,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCRDado] alterada para [${valor}]`);
			window.HPdCRDado = valor;  // Atribuindo o valor à variável global
		}
	});
	
	// Bônus Adicionado
	console.log(`${prefixo} Registrando valor do bonus do ${CHPdC} no ginásio roubado.`);
	
	game.settings.register(mID, "HPdCRBonus", {
		name: "Bônus Adicionado",
		hint: "Define o valor do bônus adicional que será aplicado ao reroll usando o Hero Point da Casa.",
		scope: "world",
		config: false,  // Para que apareça nas configurações de configurações avançadas
		type: Number,
		default: 10,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCRBonus] alterada para [${valor}]`);
			window.HPdCRBonus = valor;  // Atribuindo o valor à variável global
		}
	});
	
	// configuração para o jogador não ficar tristinho
	console.log(`${prefixo} Registrando regra "Consolação" para o ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCConsolacao", {
		name: "Hero Point da Casa Consolação",
		hint: `"A falha a gente já tem, vamos atrás é da humilhação". Se a nova rolagem for menor que a original recupera o Hero Point.`,
		scope: "world",
		config: false,
		type: Boolean,
		default: false,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCConsolacao] alterada para [${valor}]`);
		}
	});
	
	// Limite de Uso — HPdC Roubado
	console.log(`${prefixo} Registrando limites de uso do ${CHPdC} no ginásio roubado.`);
	
	game.settings.register(mID, "HPdCRLimite", {
		name: "Limite de Uso (Roubado)",
		hint: "Limita a quantidade do tipo de uso em questão.",
		scope: "world",
		config: false,
		type: Number,
		default: null,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCRLimite] alterada para [${valor}]`);
			window.HPdCRLimite = valor;
		}
	});
	
	// Limite de Uso — Consolação
	console.log(`${prefixo} Registrando limites de uso do ${CHPdC} para regra "consolação".`);
	
	game.settings.register(mID, "HPdCCLimite", {
		name: "Limite de Uso (Consolação)",
		hint: "Limita a quantidade do tipo de uso em questão.",
		scope: "world",
		config: false,
		type: Number,
		default: null,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCCLimite] alterada para [${valor}]`);
			window.HPdCCLimite = valor;
		}
	});
	
	// Limite de Uso — Dano
	console.log(`${prefixo} Registrando limide de uso do ${CHPdC} no ginásio do dano.`);
	
	game.settings.register(mID, "HPdCDLimite", {
		name: "Limite de Uso (Dano)",
		hint: "Limita a quantidade do tipo de uso em questão.",
		scope: "world",
		config: false,
		type: Number,
		default: null,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCDLimite] alterada para [${valor}]`);
			window.HPdCDLimite = valor;
		}
	});
	
	// Limite de Uso — Defensivo
	console.log(`${prefixo} Registrando limite de uso do ${CHPdC} na rota defensiva.`);
	
	game.settings.register(mID, "HPdCDfLimite", {
		name: "Limite de Uso (Defensivo)",
		hint: "Limita a quantidade do tipo de uso em questão.",
		scope: "world",
		config: false,
		type: Number,
		default: null,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [HPdCDfLimite] alterada para [${valor}]`);
			window.HPdCDfLimite = valor;
		}
	});
	
	// Dropdown para tipo de requisito
	console.log(`${prefixo} Registrando lista de requisitos para uso do ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCRequizitoTipo", {
		name: "Tipo de Requisito",
		hint: "Define se o requisito será uma feat, trait ou efeito. Escolha 'nenhum' para desativar.",
		scope: "world",
		config: false,
		type: String,
		default: "nenhum",
		choices: {
			"nenhum": "Nenhum",
			"feat": "Feat",
			"trait": "Trait",
			"effect": "Efeito"
		},
		
		onChange: valor => {
			window.HPdCRequizitoTipo = valor;
			console.log(`${prefixo} HPdCRequizitoTipo atualizado para:`, valor);
		}
	});
	
	// Campo de texto para slug
	console.log(`${prefixo} Registrando slug do pré-requisito ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCRequisitoSlug", {
		name: "Slug do Requisito",
		hint: "Insira o slug correspondente ao tipo escolhido. Deixe vazio se não for usar.",
		scope: "world",
		config: false,
		type: String,
		default: "",
		
		onChange: valor => {
			window.HPdCRequisitoSlug = valor;
			console.log(`${prefixo} HPdCRequisitoSlug atualizado para:`, valor);
		}
	});
	
	// Usar Maior Valor
	console.log(`${prefixo} Registrando opçõa par ausar o maior valor entre nova e antiga rolagem no uso do ${CHPdC}.`);
	
	game.settings.register(mID, "HPdCMaior", {
		name: "Usar Maior Valor",
		hint: "Sempre usará o maior valor entre rolagem original e nova rolagem para rolagens D20.",
		scope: "world",
		config: false,
		type: Boolean,
		default: false,
		
		onChange: valor => {
			window.HPdCMaior = valor;
			console.log(`${prefixo} HPdCMaior atualizado para:`, valor);
		}
	});

	// Futuras opções podem ser adicionadas aqui chamando registrarOpcao({ … })
	
	console.log(`${prefixo} Todas as opções foram registradas`);
});

// Essa parte define a classe para a janela de configuração de Macros Automáticas
class ClasseFormularioMacrosAutomaticas extends FormApplication {
	constructor(...args) {
		super(...args);
		console.log(`${prefixo} ClasseFormularioMacrosAutomaticas inicializada`);
	}

static get defaultOptions() {
	return foundry.utils.mergeObject(super.defaultOptions, {
		id: "icr-config-iniciar-macros",
		title: " ",
		template: "modules/i-choose-roll/templates/config-iniciar-macros.html",
		width: 700,
		height: 700,
		closeOnSubmit: true
	});
}


	getData() {
		console.log(`${prefixo} Coletando dados atuais para Macros Automáticas`);
		const ehGM = game.user.isGM;
		return {
			iniciarMacrosLista: game.settings.get(mID, "iniciarMacrosLista") || [],
			ehGM
		};
	}

activateListeners(html) {
  super.activateListeners(html);

  globalThis["i-choose-roll"].MacrosAutomaticas.instalarOuvintesMacros(html);
  globalThis["i-choose-roll"].MacrosAutomaticas.carregarBlocosMacros(html);
}

	async _updateObject(event, formData) {
		console.log(`${prefixo} Salvando configurações de Macros Automáticas`, formData);
		await game.world.setFlag(mID, "iniciarMacrosLista", formData.iniciarMacrosLista);
		ui.notifications.info(`${logo} Configurações de Macros Automáticas atualizadas.`);
	}
}

// Essa parte define a classe básica para a nova janela de configuração
class ClasseFormularioHPdC extends FormApplication {
	constructor(...args) {
		super(...args);
		
		// Essa parte loga que a classe foi inicializada
		console.log(`${prefixo} ClasseFormularioHPdC inicializada`);
	}
	
	static get defaultOptions() {
		
		// Essa parte retorna as opções padrão para a janela
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: 'icr-config-hpdc',
			title: ' ',
			template: 'modules/i-choose-roll/templates/config-hpdc.html', // aponta para o template
			width: 700,
			height: 'auto',
			closeOnSubmit: true
		});
	}
	
	getData() {
		
		// Essa parte coleta os dados atuais das configurações para exibir na janela
		console.log(`${prefixo} Coletando dados atuais para a janela HPdC`);
		return {
			ativarHeroPointDaCasa: game.settings.get(mID, 'ativarHeroPointDaCasa'),
			iconeHPdC: game.settings.get(mID, 'iconeHPdC'),
			nomeHPdC: game.settings.get(mID, 'nomeHPdC'),
			heroPointsDaCasaAdicional: game.settings.get(mID, 'heroPointsDaCasaAdicional'),
			HPdCNoDano: game.settings.get(mID, 'HPdCNoDano'),
			valorHPdC: game.settings.get(mID, 'valorHPdC'),
			HPdCDefensivo: game.settings.get(mID, 'HPdCDefensivo'),
			HPdCRoubado: game.settings.get(mID, 'HPdCRoubado'),
			HPdCConsolacao: game.settings.get(mID, 'HPdCConsolacao'),
			HPdCRDado: game.settings.get(mID, 'HPdCRDado'),
			HPdCRBonus: game.settings.get(mID, 'HPdCRBonus'),
			HPdCRLimite: game.settings.get(mID, "HPdCRLimite"),
			HPdCCLimite: game.settings.get(mID, "HPdCCLimite"),
			HPdCDLimite: game.settings.get(mID, "HPdCDLimite"),
			HPdCDfLimite: game.settings.get(mID, "HPdCDfLimite"),
			HPdCRequizitoTipo: game.settings.get(mID, "HPdCRequizitoTipo"),
			HPdCRequisitoSlug: game.settings.get(mID, "HPdCRequisitoSlug"),
			HPdCMaior: game.settings.get(mID, "HPdCMaior"),
			dicaConsolacao: `<em>"A falha a gente já tem, vamos atrás é da humilhação"</em>. Se a nova rolagem for menor que a original, recupera o Hero Point.`,
			dicaRoubado: "Se a nova rolagem do dado for <em>igual ou menor</em> que o valor determinado, adiciona o bônus à rolagem.",
			dicaDefensivo: "Permite usar o Hero Point da Casa para forçar <strong>inimigos</strong> a re-rolarem.",
			dicaValor: "Define o valor máximo de Hero Points da Casa que um personagem pode ter.",
			dicaNoDano: "Quando marcado, os Hero Points da Casa poderão ser usados para rerolar o dano.",
			dicaAdicional: "Quando marcado, os Hero Points da Casa são tratados como um recurso <strong>adicional</strong> ao Hero Point normal.",
			dicaAtivar: "Ativa a funcionalidade de Hero Point da Casa. <strong>É necessário recarregar o Foundry para aplicar</strong>.",
			dicaNome: "Insira o nome incrível da sua regra de Hero Point. Se deixar vazio, será usado 'Hero Point da Casa'.",
			dicaIcone: "Insira a URL de uma imagem incrível para o seu Hero Point da Casa.",
			dicaDado: "Coloque o valor máximo do dado para adicionar o bônus a seguir. <strong>Mínimo 1, máximo 19</strong>.",
			dicaBonus: "Coloque o valor do bônus que será aplicado à rolagem se o dado for menor ou igual ao definido. <strong>Mínimo 1</strong>.",
			dicaLimite: "Limita a quantidade de uso do tipo em questão.",
			dicaRequizitoTipo: "Escolha o tipo de requisito que será verificado antes de permitir o uso do Hero Point da Casa.",
			dicaRequizitoSlug: "Insira o <em>slug</em> da feat, trait ou efeito correspondente ao tipo escolhido. Deixe vazio para ignorar.",
			dicaMaior: "Sempre usará o maior valor entre rolagem original e nova rolagem para rolagens D20."
		};
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		
		// Essa parte ativa o listener para o botão do FilePicker
		html.find(".file-picker").off("click").on("click", ev => {
			
			// Essa parte impede o comportamento padrão do botão
			ev.preventDefault();
			
			// Essa parte pega o alvo da caixa de texto a ser atualizada
			const target = $(ev.currentTarget).data("target");
			const input = html.find(`input[name="${target}"]`);
			
			// Essa parte abre o FilePicker do Foundry
			const fp = new FilePicker({
				type: "image",
				callback: path => {
					
					// Essa parte atualiza o valor da caixa de texto com o caminho escolhido
					input.val(path);
					console.log(`${prefixo} Ícone escolhido no FilePicker:`, path);
				}
			});
			
			fp.browse();
		});
	}
	
	async _updateObject(event, formData) {
		
		// Essa parte salva os dados do formulário quando o usuário clica em salvar
		console.log(`${prefixo} Salvando configurações do HPdC`, formData);
		
		// Essa parte atualiza a flag ativarHeroPointDaCasa
		await game.settings.set(mID, 'ativarHeroPointDaCasa', formData.ativarHeroPointDaCasa);
		console.log(`${prefixo} Flag ativarHeroPointDaCasa atualizada para`, formData.ativarHeroPointDaCasa);
		
		// Essa parte atualiza a flag iconeHPdC
		await game.settings.set(mID, 'iconeHPdC', formData.iconeHPdC);
		console.log(`${prefixo} Flag iconeHPdC atualizada para`, formData.iconeHPdC);
		
		// Essa parte atualiza a flag nomeHPdC
		await game.settings.set(mID, 'nomeHPdC', formData.nomeHPdC);
		console.log(`${prefixo} Flag nomeHPdC atualizada para`, formData.nomeHPdC);
		
		// Essa parte notifica o usuário que as configurações foram salvas
		ui.notifications.info(`${logo} Configurações do Hero Point da Casa atualizadas.`);
		
		//Essa parte atualiza se HPdC é adicional ou n
		await game.settings.set(mID, 'heroPointsDaCasaAdicional', formData.heroPointsDaCasaAdicional);
		console.log(`${prefixo} Flag heroPointsDaCasaAdicional atualizada para`, formData.heroPointsDaCasaAdicional);
		
		// Essa parte  atualiza o uso do dano
		await game.settings.set(mID, 'HPdCNoDano', formData.HPdCNoDano);
		console.log(`${prefixo} Flag HPdCNoDano atualizada para`, formData.HPdCNoDano);
		
		// Essa parte registra o valor max de HPdC
		await game.settings.set(mID, 'valorHPdC', formData.valorHPdC);
		console.log(`${prefixo} Flag valorHPdC atualizada para`, formData.valorHPdC);
		
		// Essa parte registra regra ddefensiva
		await game.settings.set(mID, 'HPdCDefensivo', formData.HPdCDefensivo);
		console.log(`${prefixo} Flag HPdCDefensivo atualizada para`, formData.HPdCDefensivo);
		
		// Essa parte registra o Hero Point Roubado
		await game.settings.set(mID, 'HPdCRoubado', formData.HPdCRoubado);
		console.log(`${prefixo} Flag HPdCRoubado atualizada para`, formData.HPdCRoubado);
		
		// Essa parte registra o Hero Point Consolação -> Emy, não! Feio! -esperra água- >:(
		await game.settings.set(mID, 'HPdCConsolacao', formData.HPdCConsolacao);
		console.log(`${prefixo} Flag HPdCConsolacao atualizada para`, formData.HPdCConsolacao);
		
		// Salva o tipo de requisito (feat, trait, effect, nenhum)
		await game.settings.set(mID, "HPdCRequizitoTipo", formData.HPdCRequizitoTipo);
		console.log(`${prefixo} Flag HPdCRequizitoTipo atualizada para`, formData.HPdCRequizitoTipo);
		
		// Salva o slug do requisito definido pelo GM
		await game.settings.set(mID, "HPdCRequisitoSlug", formData.HPdCRequisitoSlug);
		console.log(`${prefixo} Flag HPdCRequisitoSlug atualizada para`, formData.HPdCRequisitoSlug);
		
		// Salva o valor máximo do dado para acionar bônus (Keeley)
		await game.settings.set(mID, "HPdCRDado", formData.HPdCRDado);
		console.log(`${prefixo} Flag HPdCRDado atualizada para`, formData.HPdCRDado);
		
		// Salva o valor do bônus adicional aplicado se o dado for baixo
		await game.settings.set(mID, "HPdCRBonus", formData.HPdCRBonus);
		console.log(`${prefixo} Flag HPdCRBonus atualizada para`, formData.HPdCRBonus);
		
		// Salva o limite de uso do HPdC no modo Roubado
		await game.settings.set(mID, "HPdCRLimite", formData.HPdCRLimite);
		console.log(`${prefixo} Flag HPdCRLimite atualizada para`, formData.HPdCRLimite);
		
		// Salva o limite de uso do HPdC modo Consolação
		await game.settings.set(mID, "HPdCCLimite", formData.HPdCCLimite);
		console.log(`${prefixo} Flag HPdCCLimite atualizada para`, formData.HPdCCLimite);
		
		// Salva o limite de uso do HPdC no Dano
		await game.settings.set(mID, "HPdCDLimite", formData.HPdCDLimite);
		console.log(`${prefixo} Flag HPdCDLimite atualizada para`, formData.HPdCDLimite);
		
		// Salva o limite de uso do HPdC Defensivo
		await game.settings.set(mID, "HPdCDfLimite", formData.HPdCDfLimite);
		console.log(`${prefixo} Flag HPdCDfLimite atualizada para`, formData.HPdCDfLimite);
		
		//Salva as alterações em HPdCMaior
		await game.settings.set(mID, 'HPdCMaior', formData.HPdCMaior);
		console.log(`${prefixo} Flag HPdCMaior atualizada para`, formData.HPdCMaior);
		
		//Salva alterações no modo debug
		await game.settings.set(mID, 'modoDebug', formData.modoDebug);	
		console.log(`${prefixo} Flag modoDebug atualizada para`, formData.modoDebug);
	}
}
	console.log(`${prefixo} Registrando HPdC.`);

//====================
// Bloco 3 - Função para registrar uma opção com suporte a recarregamento
//====================
function registrarOpcao({ chave, nome, dica, padrao, precisaRecarregar = false }) {
	if (precisaRecarregar) {
		opcoesComRecarregar.add(chave);
	}
	
	game.settings.register(mID, chave, {
		name: nome,
		hint: dica,
		scope: "world",
		config: false,
		default: padrao,
		type: Boolean,
		
		onChange: valor => {
			console.log(`${prefixo} Opção [${chave}] alterada para [${valor}]`);
			
			if (opcoesComRecarregar.has(chave)) {
				console.log(`${prefixo} A opção [${chave}] exige recarregar. Perguntando ao Mestre.`);
				perguntarRecarregar();
			}
		}
	});
}

//====================
// Bloco 4 - Função para perguntar ao Mestre se deseja recarregar todos os clientes
//====================
function perguntarRecarregar() {
	
	Dialog.confirm({
		title: `${prefixo} Recarregar clientes`,
		content: `<p>Essa alteração exige recarregar todos os clientes para ter efeito. Deseja recarregar agora?</p>`,
		
		yes: () => {
			console.log(`${prefixo} Mestre confirmou. Recarregando todos os clientes.`);
			const socket = socketlib.registerModule(mID);
			socket.executeForEveryone("recarregarClientes");
		},
		
		no: () => {
			console.log(`${prefixo} Mestre optou por não recarregar agora.`);
		},
		
		defaultYes: false
	});
}

// define valores globais para a primeira execução de todos que precisam mas n estão no script
Hooks.once("ready", () => {
	let iconeConfig = game.settings.get(mID, "iconeHPdC")?.trim();
	if (iconeConfig) {
		iconeHPdC = `<img src="${iconeConfig}" alt="iconeHPdC" width="28" height="28" style="vertical-align:middle; margin-right:6px;">`;
	} else {
		iconeHPdC = logoP;
	}
	window.iconeHPdC = iconeHPdC;
	console.log(`${prefixo} iconeHPdC inicializado como:`, iconeHPdC);
	
	nomeHPdC = game.settings.get(mID, "nomeHPdC")?.trim() || "Hero Point da Casa";
	window.nomeHPdC = nomeHPdC;
	console.log(`${prefixo} nomeHPdC inicializado como:`, nomeHPdC);
	
	window.HPdCRDado = game.settings.get(mID, "HPdCRDado");
	console.log(`${prefixo} HPdCRDado inicializado com valor:`, window.HPdCRDado);
	
	window.HPdCRBonus = game.settings.get(mID, "HPdCRBonus");
	console.log(`${prefixo} HPdCRBonus inicializado com valor:`, window.HPdCRBonus);
	
	window.HPdCRLimite = game.settings.get(mID, "HPdCRLimite");
	console.log(`${prefixo} HPdCRLimite inicializado com valor:`, window.HPdCRLimite);
	
	window.HPdCCLimite = game.settings.get(mID, "HPdCCLimite");
	console.log(`${prefixo} HPdCCLimite inicializado com valor:`, window.HPdCCLimite);
	
	window.HPdCDLimite = game.settings.get(mID, "HPdCDLimite");
	console.log(`${prefixo} HPdCDLimite inicializado com valor:`, window.HPdCDLimite);
	
	window.HPdCDfLimite = game.settings.get(mID, "HPdCDfLimite");
	console.log(`${prefixo} HPdCDfLimite inicializado com valor:`, window.HPdCDfLimite);
	
	window.HPdCRequizitoTipo = game.settings.get(mID, "HPdCRequizitoTipo");
	console.log(`${prefixo} HPdCRequizitoTipo inicializado como:`, window.HPdCRequizitoTipo);
	
	window.HPdCRequisitoSlug = game.settings.get(mID, "HPdCRequisitoSlug");
	console.log(`${prefixo} HPdCRequisitoSlug inicializado como:`, window.HPdCRequisitoSlug);
	
	window.HPdCMaior = game.settings.get(mID, "HPdCMaior");
	console.log(`${prefixo} HPdCMaior inicializado como:`, window.HPdCMaior);
	
	window.valorHPdC = game.settings.get(mID, "valorHPdC");
	console.log(`${prefixo} valorHPdC inicializado como:`, window.valorHPdC);
	
	window.debugLigado = debugLigado;
	console.log(`${prefixo} debug exportado apra window`);
	
	window.logDebug = logDebug;
	console.log(`${prefixo} logdebug exportado apra window`);
});