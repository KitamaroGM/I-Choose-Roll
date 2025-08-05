//====================
// SocketLink - permite que jogadores executem funções protegidas via GM
//====================

// Log de rastreio: arquivo de SocketLink carregado
console.log(`I Choose Roll! [SocketLink] 1.0.12 carregado — inicializando variáveis e constantes`);
//====================
// Constantes globais para manter o padrão do projeto
//====================
const CMacros = "i-choose-roll.i-choose-macros";
const NCMacros = "I Choose Macros!";
const prefixo = "I Choose Roll! [SocketLink]";
const mNome = "I Choose Roll!";
const mID = "i-choose-roll";
const CS = "i-choose-roll.choose-roll-system-bindings";
const NCSistema = "I Choose Roll! [Arquivos de Sistema]";

//====================
// Registro do módulo e funções no SocketLib
//====================
Hooks.once("socketlib.ready", () => {
  console.log(`${prefixo} socketlib.ready disparado`);
  const SocketLink = socketlib.registerModule(mID);
  console.log(`${prefixo} Módulo '${mNome}' registrado no SocketLib`);
  console.log(`${prefixo} Inicializando namespace API do módulo`);

// Garante que game.modules.get(mID).api exista
const mod = game.modules.get(mID);
mod.api = mod.api || {};

console.log(`${prefixo} Namespace API inicializado com stub resolveDefensivo`);

  //====================
  // destravarCompendio - Remove o travamento de um compêndio
  //====================
  console.log(`${prefixo} Registrando função: destravarCompendio`);
  SocketLink.register("destravarCompendio", async (compendioId) => {
  const compendio = game.packs.get(compendioId);
  if (!compendio) throw new Error(`Compêndio '${compendioId}' não encontrado.`);
  await compendio.configure({ locked: false });
  return true;
});
  console.log(`${prefixo} Função registrada com sucesso: destravarCompendio`);

  //====================
  // retravarCompendio - Restaura o travamento de um compêndio
  //====================
  console.log(`${prefixo} Registrando função: retravarCompendio`);
  SocketLink.register("retravarCompendio", async (compendioId) => {
  const compendio = game.packs.get(compendioId);
  if (!compendio) throw new Error(`Compêndio '${compendioId}' não encontrado.`);
  await compendio.configure({ locked: true });
  return true;
});
  console.log(`${prefixo} Função registrada com sucesso: retravarCompendio`);

  //====================
  // criarPasta - Cria uma pasta no compêndio especificado
  //====================
  console.log(`${prefixo} Registrando função: criarPasta`);
  SocketLink.register("criarPasta", async (dados, compendioId) => {
    return await Folder.create(dados, { pack: compendioId });
  });
  console.log(`${prefixo} Função registrada com sucesso: criarPasta`);

  //====================
  // deletarItem - Remove um item do compêndio
  //====================
  console.log(`${prefixo} Registrando função: deletarItem`);
SocketLink.register("deletarItem", async (compendioId, id) => {
  const compendio = game.packs.get(compendioId);
  if (!compendio) throw new Error(`Compêndio '${compendioId}' não encontrado.`);
  return await compendio.documentClass.deleteDocuments([id], { pack: compendio.collection });
});
  console.log(`${prefixo} Função registrada com sucesso: deletarItem`);

  //====================
  // criarItem - Cria um novo item dentro do compêndio
  //====================
  console.log(`${prefixo} Registrando função: criarItem`);
SocketLink.register("criarItem", async (dadosItem, compendioId) => {
  const compendio = game.packs.get(compendioId);
  return await Item.create(dadosItem, { pack: compendio.collection });
});
  console.log(`${prefixo} Função registrada com sucesso: criarItem`);

  //====================
  // lerDocumentosCompendio - Garante acesso aos documentos de um compêndio restrito, executado como GM
  //====================
  console.log(`${prefixo} Registrando função: lerDocumentosCompendio`);
  SocketLink.register("lerDocumentosCompendio", async (compendioId) => {
    const compendio = game.packs.get(compendioId);
    if (!compendio) {
      console.warn(`${prefixo} Compêndio '${compendioId}' não encontrado em lerDocumentosCompendio`);
      return false;
    }
    await compendio.getDocuments();
    console.log(`${prefixo} Leitura de documentos realizada com sucesso para '${compendioId}'`);
    return true;
  });
  console.log(`${prefixo} Função registrada com sucesso: lerDocumentosCompendio`);
//====================
// criarMensagemGenerica - Cria uma ChatMessage com conteúdo customizado, visível para todos ou só GMs
//====================
console.log(`${prefixo} Registrando função: criarMensagemGenerica`);
SocketLink.register("criarMensagemGenerica", async (chatData) => {
  if (!chatData?.speaker || !chatData.content) {
     console.warn(`${prefixo} Dados inválidos para criação de mensagem.`);
     return;
  }
  const msg = await ChatMessage.create(chatData);
  return msg.id;
});
console.log(`${prefixo} Função registrada com sucesso: criarMensagemGenerica`);

//====================
// deletaMensagem - Apaga uma ChatMessage, visível para todos ou só GMs
//====================
console.log(`${prefixo} Registrando função: deletarMensagem`);
SocketLink.register("deletarMensagem", async (idMensagem) => {
  try {
    const msg = game.messages.get(idMensagem);
    if (msg) {
      await msg.delete();
      console.log(`${prefixo} [SocketLink] Mensagem ${idMensagem} apagada via GM.`);
      return true;
    } else {
      console.warn(`${prefixo} [SocketLink] Mensagem ${idMensagem} não encontrada.`);
      return false;
    }
  } catch (err) {
    console.error(`${prefixo} [SocketLink] Erro ao apagar mensagem:`, err);
    throw err;
  }
});
console.log(`${prefixo} Função registrada com sucesso: deletarMensagem`);


//====================
// RespostaDeMensagem - handler genérico para respostas de chat via SocketLink
//====================
console.log(`${prefixo} Registrando função: RespostaDeMensagem`);
SocketLink.register("RespostaDeMensagem", async ({ msgId, resposta }) => {
  try {
    // esse passo registra início do processamento
    console.log(`${prefixo} [RespostaDeMensagem] Iniciando processamento para msgId=${msgId}, resposta=${resposta}`);
    
    // esse passo valida parâmetros mínimos
    if (!msgId) {
      console.warn(`${prefixo} [RespostaDeMensagem] msgId inválido ou ausente`);
      return;
    }
    
    // esse passo obtém a API do módulo para despacho interno
    const api = game.modules.get(mID)?.api;
    if (!api) {
      console.error(`${prefixo} [RespostaDeMensagem] API do módulo não encontrada`);
      return;
    }
    if (typeof api.responderMensagem !== "function") {
      console.error(`${prefixo} [RespostaDeMensagem] Método 'responderMensagem' não implementado na API`);
      return;
    }

    // esse passo chama o método interno responsável por tratar a resposta
    console.log(`${prefixo} [RespostaDeMensagem] Chamando api.responderMensagem(${msgId}, ${resposta})`);
    await api.responderMensagem(msgId, resposta);
    
    // esse passo confirma sucesso da operação
    console.log(`${prefixo} [RespostaDeMensagem] Resposta processada com sucesso para msgId=${msgId}`);
  } catch (erro) {
    // esse passo captura e loga qualquer erro ocorrido
    console.error(`${prefixo} [RespostaDeMensagem] Erro ao processar resposta de mensagem:`, erro);
  }
});
console.log(`${prefixo} Função registrada com sucesso: RespostaDeMensagem`);

//====================
// executarRerollSimplesComoGM - Executa uma rerrolagem simples no GM e retorna a nova rolagem serializada
//====================
console.log(`${prefixo} Registrando função: executarRerollSimplesComoGM`);

SocketLink.register("executarRerollSimplesComoGM", async ({ rollData, keep = "new" }) => {
  try {
    console.log(`${prefixo} [executarRerollSimplesComoGM] Iniciando execução`);

    // esse passo valida se os dados da rolagem foram passados corretamente
    if (!rollData) {
      console.warn(`${prefixo} [executarRerollSimplesComoGM] Dados da rolagem ausentes. Abortando.`);
      return null;
    }

    console.log(`${prefixo} [executarRerollSimplesComoGM] Dados recebidos. Keep: "${keep}"`);

    // esse passo reconstrói a rolagem original a partir do toJSON
    const rolagemOriginal = Roll.fromData(rollData);
    console.log(`${prefixo} [executarRerollSimplesComoGM] Rolagem original reconstruída com fórmula: ${rolagemOriginal.formula}`);

    // esse passo executa a nova rerrolagem com a opção keep (padrão: "new")
    const novaRolagem = await rolagemOriginal.reroll({ keep });
    console.log(`${prefixo} [executarRerollSimplesComoGM] Nova rolagem executada com total: ${novaRolagem.total}`);

    // esse passo retorna os dados da nova rolagem para o cliente
    return {
      novaRolagem: novaRolagem.toJSON(),
      total: novaRolagem.total
    };

  } catch (erro) {
    // esse passo captura e loga qualquer erro ocorrido
    console.error(`${prefixo} [executarRerollSimplesComoGM] Erro durante a execução:`, erro);
    return null;
  }
});

console.log(`${prefixo} Função registrada com sucesso: executarRerollSimplesComoGM`);

//====================
// dispararHookRerollComoGM - Dispara o hook 'pf2e.reroll' no contexto do GM
//====================
SocketLink.register("dispararHookRerollComoGM", async ({ mensagemId, novaRolagemData, rolagemOriginalData, keep }) => {
  try {
    console.log(`${prefixo} [dispararHookRerollComoGM] Iniciando execução`);

    // esse passo recupera a mensagem original pelo ID
    const mensagem = game.messages.get(mensagemId);
    if (!mensagem) {
      console.warn(`${prefixo} [dispararHookRerollComoGM] Mensagem ID ${mensagemId} não encontrada.`);
      return false;
    }

    // esse passo reconstrói as rolagens recebidas (Roll.fromData)
    const novaRolagem = Roll.fromData(novaRolagemData);
    const rolagemOriginal = Roll.fromData(rolagemOriginalData);

    // esse passo dispara o hook do sistema PF2e
    Hooks.call("pf2e.reroll", mensagem, {
      newRoll: novaRolagem,
      oldRoll: rolagemOriginal,
      keep
    });

    console.log(`${prefixo} [dispararHookRerollComoGM] Hook 'pf2e.reroll' disparado com sucesso.`);

    return true;

  } catch (erro) {
    console.error(`${prefixo} [dispararHookRerollComoGM] Erro durante execução:`, erro);
    return false;
  }
});

console.log(`${prefixo} Função registrada com sucesso: dispararHookRerollComoGM`);

//====================
// aceitarDesafio — Solicita autorização ao GM para rerolagem defensiva
//====================
console.log(`${prefixo} Registrando função de resposta para HPdCDefensivo`);

SocketLink.register("aceitarDesafioSocket", async (dadosKanto) => {
	
  try {
    console.log(`${prefixo} [aceitarDesafio] Iniciando solicitação de rerolagem defensiva.`);
	const icone = game.settings.get("i-choose-roll", "iconeHPdC")?.trim();
const iconeHPdC = icone
  ? `<img src="${icone}" alt="iconeHPdC" width="28" height="28" style="vertical-align:middle; margin-right:6px;">`
  : `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="28" height="28" style="vertical-align:middle; margin-right:6px;">`;
const nomeHPdC = game.settings.get(mID, "nomeHPdC")?.trim() || "Hero Point da Casa";

    const ator = dadosKanto.entradaMensagem.ator;
    const pagante = dadosKanto.pagante;
    const tipoLabel = game.i18n.localize(`PF2E.Check.Result.${dadosKanto.contexto?.type ?? "check"}`) || "rolagem";

    // Bloco 1 - HTML da mensagem de confirmação
    const html = `
      <div class="hpdc-defensivo-confirmar" data-msg-id="pendente">
        <p>
          <strong>${iconeHPdC.replace(/width="\\d+"/, 'width="22"').replace(/height="\\d+"/, 'height="22"')} ${nomeHPdC} (Defensivo)</strong>
          <br><br>
          Deseja forçar nova rolagem de <strong>${tipoLabel}</strong> para <strong>${ator.name}</strong>?
        </p>
        <p><em>Pagando com ${nomeHPdC} de: ${pagante.name}</em></p>
        <div style="margin-top: 8px;">
          <button class="confirmar-hpdc-def" style="cursor: pointer;">Confirmar reroll</button><br>
          <button class="cancelar-hpdc-def" style="cursor: pointer;">Cancelar</button>
        </div>
      </div>`;

    // Bloco 2 - Envia mensagem via socket para criação pelo GM
console.log(`${prefixo} [aceitarDesafio] Buscando token e speaker do pagante.`);

// Recupera o ator pagante
if (!pagante) {
  console.warn(`${prefixo} [aceitarDesafio] Pagante não definido em dadosKanto.`);
  return false;
}


// Monta e envia a mensagem para o GM via socket

const speaker = {
  user: dadosKanto.usuarioId,
  alias: dadosKanto.usuarioNome
};

const socket = socketlib.registerModule(mID);  
const dados = {
  speaker,
  content: html,
  whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id)
};

const msg = await ChatMessage.create(dados);
const msgId = msg.id;

console.log(`${prefixo} [aceitarDesafio] Mensagem enviada ao GM. ID da mensagem: ${msgId}`);

    // Bloco 3 - Espera pela resposta do GM
    const escolha = await new Promise(resolve => {
      const gancho = Hooks.on("renderChatMessage", (msg, html) => {
        if (msg.id !== msgId) return;

        console.log(`${prefixo} [aceitarDesafio] Mensagem ${msgId} reconhecida. Preparando botões...`);
		
		 html.find('.hpdc-defensivo-confirmar[data-msg-id="pendente"]').attr("data-msg-id", msgId);
        const $card = html.find(`.hpdc-defensivo-confirmar[data-msg-id="${msgId}"]`);
        if (!$card.length) {
          console.warn(`${prefixo} [aceitarDesafio] Div de confirmação não encontrada para msgId=${msgId}`);
          return;
        }

        // clique em "Confirmar"
        $card.find(".confirmar-hpdc-def").off("click").on("click", () => {
          console.log(`${prefixo} [aceitarDesafio] GM confirmou reroll defensivo`);
          Hooks.off("renderChatMessage", gancho);
		  game.messages.get(msgId)?.delete();
          resolve(true);
        });

        // clique em "Cancelar"
        $card.find(".cancelar-hpdc-def").off("click").on("click", () => {
          console.log(`${prefixo} [aceitarDesafio] GM cancelou reroll defensivo`);
          Hooks.off("renderChatMessage", gancho);
		  game.messages.get(msgId)?.delete();
          resolve(false);
        });
      });
    });

    console.log(`${prefixo} [aceitarDesafio] Resposta final do GM: ${escolha}`);
    return escolha;

  } catch (erro) {
    console.error(`${prefixo} [aceitarDesafio] Erro durante solicitação defensiva:`, erro);
    return false;
  }
});

//====================
// coletarDadosKanto - Bloco Inicial da jornada HPdC (coleta de dados da mensagem, usuário e atores controlados)
//====================
console.log(`${prefixo} Registrando jornada por kanto, registro da região Kanto terminado. Pegando dados do treinador`);

SocketLink.register("coletarDadosKanto", async (msgId) => {
  const mensagem = game.messages.get(msgId);
  if (!mensagem) return null;

  console.log(`${prefixo} [coletarDadosKanto] Iniciando coleta de dados para a mensagem ID ${mensagem.id}`);

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

const api = game.modules.get(mID)?.api;
const ginasiosDisponiveis = {
  GinasioNormal: api?.GinasioNormal,
  GinasioDoDano: api?.GinasioDoDano,
  GinasioKeeley: api?.GinasioKeeley
  //outros ginasios adicionados aqui depois
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
  console.log(`${prefixo} [coletarDadosKanto] Ator da mensagem é personagem com disposição normal — uso direto.`);

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
  console.log(`${prefixo} [coletarDadosKanto] Disposição -1 detectada — rota defensiva.`);

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
  console.log(`${prefixo} [coletarDadosKanto] Situação normal — varrendo atores permitidos.`);

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

  console.log(`${prefixo} [coletarDadosKanto] Coleta de atores finalizada. ${atoresControlados.length} atores controlados detectados.`);

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

  console.log(`${prefixo} [coletarDadosKanto] Coleta finalizada com sucesso.`);
  dadosKanto.permanentes = await atorPrincipal.getFlag(mID, "heroPointsDaCasa") ?? 0;
  return dadosKanto;
});

  //====================
  // criarHookMovimento - Cria um hook de movimento para vincular cavaleiro à montaria
  //====================
  console.log(`${prefixo} Registrando função: criarHookMovimento`);
  SocketLink.register("criarHookMovimento", async ({ montariaId, cavaleiroId, deslocamentoX, deslocamentoY, ajusteSort }) => {
    const montaria = canvas.tokens.get(montariaId);
    const cavaleiro = canvas.tokens.get(cavaleiroId);

    if (!montaria || !cavaleiro) {
      console.warn(`${prefixo} Tokens não encontrados para criar hook de movimento.`);
      return null;
    }

    const idVinculo = `link-${canvas.scene.id}-${cavaleiroId}-${montariaId}`;
    if (!game.tokenAttacherGhostHooks) game.tokenAttacherGhostHooks = {};
    if (game.tokenAttacherGhostHooks[idVinculo]) Hooks.off("updateToken", game.tokenAttacherGhostHooks[idVinculo]);

    const hookId = Hooks.on("updateToken", (doc, alteracao) => {
      if (doc.id !== montariaId) return;
      const dx = (alteracao.x ?? doc.x) + deslocamentoX;
      const dy = (alteracao.y ?? doc.y) + deslocamentoY;
      const rotacao = alteracao.rotation ?? doc.rotation;
      const elevacao = alteracao.hasOwnProperty("elevation") ? alteracao.elevation : doc.elevation;
      const ordem = alteracao.sort ?? doc.sort;
      cavaleiro.document.update({ x: dx, y: dy, rotation: rotacao, elevation: elevacao, sort: ordem + ajusteSort });
    });

    game.tokenAttacherGhostHooks[idVinculo] = hookId;
    return hookId;
  });
  console.log(`${prefixo} Função registrada com sucesso: criarHookMovimento`);

//====================
// recarregarClientes - Recarrega todos os clientes do Foundry
//====================
console.log(`${prefixo} Registrando função: recarregarClientes`);
SocketLink.register("recarregarClientes", async () => {
	location.reload();
	});
console.log(`${prefixo} Função registrada com sucesso: recarregarClientes`);

console.log(`${prefixo} Registro de todas as funções concluído`);
});