//====================
// SocketLink - permite que jogadores executem funções protegidas via GM
//====================

// Log de rastreio: arquivo de SocketLink carregado
console.log(`I Choose Roll! [SocketLink] 1.0.13 carregado — inicializando variáveis e constantes`);

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

//====================
// alterarConfiguracoesTile - Altera os dados de um tile via GM e dá play no vídeo (se aplicável)
//====================
console.log(`${prefixo} Registrando função: alterarConfiguracoesTile`);

SocketLink.register("alterarConfiguracoesTile", async ({ uuidTile, novosDados }) => {
  try {
    logDebug(`${prefixo} [alterarConfiguracoesTile] Iniciando com UUID: ${uuidTile}`);

    // Validação básica dos parâmetros
    if (!uuidTile || novosDados === undefined) {
      console.warn(`${prefixo} [alterarConfiguracoesTile] Parâmetros ausentes ou inválidos`);
      return false;
    }

    // Recupera o TileDocument
    const tile = await fromUuid(uuidTile);
    if (!tile) {
      console.warn(`${prefixo} [alterarConfiguracoesTile] Tile não encontrado para UUID: ${uuidTile}`);
      return false;
    }

    logDebug(`${prefixo} [alterarConfiguracoesTile] Tile encontrado: ID = ${tile.id}`);

    // Aplica as alterações no documento (se houver)
    if (Object.keys(novosDados).length > 0) {
      await tile.update(novosDados);
      logDebug(`${prefixo} [alterarConfiguracoesTile] Tile atualizado com sucesso`);
    } else {
      logDebug(`${prefixo} [alterarConfiguracoesTile] Nenhum dado de atualização fornecido`);
    }

    // Tenta acessar e tocar o vídeo diretamente
    const fonte = tile?.object?.texture?.baseTexture?.resource?.source;

    if (fonte instanceof HTMLVideoElement) {
      logDebug(`${prefixo} [alterarConfiguracoesTile] Tile contém vídeo — tentando iniciar reprodução...`);
      await fonte.play();
      logDebug(`${prefixo} [alterarConfiguracoesTile] Reprodução de vídeo iniciada com sucesso`);
    } else {
      logDebug(`${prefixo} [alterarConfiguracoesTile] Tile não contém vídeo válido ou fonte inacessível`);
    }

    return true;

  } catch (erro) {
    console.error(`${prefixo} [alterarConfiguracoesTile] Erro ao processar tile:`, erro);
    return false;
  }
});

console.log(`${prefixo} Função registrada com sucesso: alterarConfiguracoesTile`);

//====================
// alterarConfiguracoesLuz - Altera os dados de uma luz via GM
//====================
console.log(`${prefixo} Registrando função: alterarConfiguracoesLuz`);

SocketLink.register("alterarConfiguracoesLuz", async ({ uuidLuz, novosDados }) => {
  try {
    logDebug(`${prefixo} [alterarConfiguracoesLuz] Iniciando com UUID: ${uuidLuz}`);
    
    // Valida parâmetros
    if (!uuidLuz || !novosDados) {
      console.warn(`${prefixo} [alterarConfiguracoesLuz] Parâmetros ausentes ou inválidos`);
      return false;
    }

    // Recupera a luz via UUID
    const luz = await fromUuid(uuidLuz);
    if (!luz) {
      console.warn(`${prefixo} [alterarConfiguracoesLuz] Luz não encontrada para UUID: ${uuidLuz}`);
      return false;
    }

    logDebug(`${prefixo} [alterarConfiguracoesLuz] Luz encontrada: ID = ${luz.id}`);

    // Aplica as alterações
    await luz.update(novosDados);
    logDebug(`${prefixo} [alterarConfiguracoesLuz] Luz atualizada com sucesso`);

    return true;

  } catch (erro) {
    console.error(`${prefixo} [alterarConfiguracoesLuz] Erro ao atualizar luz:`, erro);
    return false;
  }
});

console.log(`${prefixo} Função registrada com sucesso: alterarConfiguracoesLuz`);

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
    logDebug(`${prefixo} Leitura de documentos realizada com sucesso para '${compendioId}'`);
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
      logDebug(`${prefixo} Mensagem ${idMensagem} apagada via GM.`);
      return true;
    } else {
      console.warn(`${prefixo} Mensagem ${idMensagem} não encontrada.`);
      return false;
    }
  } catch (err) {
    console.error(`${prefixo} Erro ao apagar mensagem:`, err);
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
    logDebug(`${prefixo} [RespostaDeMensagem] Iniciando processamento para msgId=${msgId}, resposta=${resposta}`);
    
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
    logDebug(`${prefixo} [RespostaDeMensagem] Chamando api.responderMensagem(${msgId}, ${resposta})`);
    await api.responderMensagem(msgId, resposta);
    
    // esse passo confirma sucesso da operação
    logDebug(`${prefixo} [RespostaDeMensagem] Resposta processada com sucesso para msgId=${msgId}`);
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
    logDebug(`${prefixo} [executarRerollSimplesComoGM] Iniciando execução`);

    // esse passo valida se os dados da rolagem foram passados corretamente
    if (!rollData) {
      console.warn(`${prefixo} [executarRerollSimplesComoGM] Dados da rolagem ausentes. Abortando.`);
      return null;
    }

    logDebug(`${prefixo} [executarRerollSimplesComoGM] Dados recebidos. Keep: "${keep}"`);

    // esse passo reconstrói a rolagem original a partir do toJSON
    const rolagemOriginal = Roll.fromData(rollData);
    logDebug(`${prefixo} [executarRerollSimplesComoGM] Rolagem original reconstruída com fórmula: ${rolagemOriginal.formula}`);

    // esse passo executa a nova rerrolagem com a opção keep (padrão: "new")
    const novaRolagem = await rolagemOriginal.reroll({ keep });
    logDebug(`${prefixo} [executarRerollSimplesComoGM] Nova rolagem executada com total: ${novaRolagem.total}`);

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
    logDebug(`${prefixo} [dispararHookRerollComoGM] Iniciando execução`);

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

    logDebug(`${prefixo} [dispararHookRerollComoGM] Hook 'pf2e.reroll' disparado com sucesso.`);

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
    logDebug(`${prefixo} [aceitarDesafio] Iniciando solicitação de rerolagem defensiva.`);
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
logDebug(`${prefixo} [aceitarDesafio] Buscando token e speaker do pagante.`);

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

logDebug(`${prefixo} [aceitarDesafio] Mensagem enviada ao GM. ID da mensagem: ${msgId}`);

    // Bloco 3 - Espera pela resposta do GM
    const escolha = await new Promise(resolve => {
      const gancho = Hooks.on("renderChatMessage", (msg, html) => {
        if (msg.id !== msgId) return;

        logDebug(`${prefixo} [aceitarDesafio] Mensagem ${msgId} reconhecida. Preparando botões...`);
		
		 html.find('.hpdc-defensivo-confirmar[data-msg-id="pendente"]').attr("data-msg-id", msgId);
        const $card = html.find(`.hpdc-defensivo-confirmar[data-msg-id="${msgId}"]`);
        if (!$card.length) {
          console.warn(`${prefixo} [aceitarDesafio] Div de confirmação não encontrada para msgId=${msgId}`);
          return;
        }

        // clique em "Confirmar"
        $card.find(".confirmar-hpdc-def").off("click").on("click", () => {
          logDebug(`${prefixo} [aceitarDesafio] GM confirmou reroll defensivo`);
          Hooks.off("renderChatMessage", gancho);
		  game.messages.get(msgId)?.delete();
          resolve(true);
        });

        // clique em "Cancelar"
        $card.find(".cancelar-hpdc-def").off("click").on("click", () => {
          logDebug(`${prefixo} [aceitarDesafio] GM cancelou reroll defensivo`);
          Hooks.off("renderChatMessage", gancho);
		  game.messages.get(msgId)?.delete();
          resolve(false);
        });
      });
    });

    logDebug(`${prefixo} [aceitarDesafio] Resposta final do GM: ${escolha}`);
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
// removerOuvinteInteracao - remove ouvintes de interação em todos os clientes
//====================
console.log(`${prefixo} Registrando função: removerInteracoesDocumento`);

SocketLink.register("removerInteracoesDocumento", async ({ docId, nomeConfig }) => {
  logDebug(`${prefixo} [removerInteracoesDocumento] recebido no socket — disparando hook global.`);

  const doc = canvas.tokens.get(docId)?.document
           || canvas.tiles.get(docId)?.document
           || canvas.notes.get(docId)?.document;

  if (!doc) {
    console.warn(`${prefixo} Documento não encontrado para ID=${docId}`);
    return false;
  }

  Hooks.call("icr.removerInteracoesDocumento", { docId: doc.id, nomeConfig });
  return true;
});
console.log(`${prefixo} Função registrada com sucesso: removerInteracoesDocumento`);

//====================
// instalarOuvinteInteracao - instala ouvintes de interação em todos os clientes
//====================
console.log(`${prefixo} Registrando função: instalarInteracoesDocumento`);

SocketLink.register("instalarInteracoesDocumento", async ({ docId, nomeConfig }) => {
  logDebug(`${prefixo} [instalarInteracoesDocumento] recebido no socket — disparando hook global.`);

  const doc = canvas.tokens.get(docId)?.document
           || canvas.tiles.get(docId)?.document
           || canvas.notes.get(docId)?.document;

  if (!doc) {
    console.warn(`${prefixo} Documento não encontrado para ID=${docId}`);
    return false;
  }

  Hooks.call("icr.instalarInteracoesDocumento", { docId: doc.id, nomeConfig });
  return true;
});
console.log(`${prefixo} Função registrada com sucesso: instalarInteracoesDocumento`);

//====================
// receberListaDoPlayer - Player expõe sua lista de macros para o GM
//====================
console.log(`${prefixo} Registrando função: receberListaDoPlayer`);

SocketLink.register("receberListaDoPlayer", async ({ userId, lista }) => {
  try {
    const usuario = game.users.get(userId);
    if (!usuario) {
      console.warn(`${prefixo} [receberListaDoPlayer] Usuário não encontrado para ID=${userId}`);
      return false;
    }

    await usuario.setFlag(mID, "iniciarMacrosLista", lista);
    logDebug(`${prefixo} [receberListaDoPlayer] Lista recebida do player ${userId} e salva em User.flags`);
    return true;
  } catch (erro) {
    console.error(`${prefixo} [receberListaDoPlayer] Erro ao salvar lista:`, erro);
    return false;
  }
});

console.log(`${prefixo} Função registrada com sucesso: receberListaDoPlayer`);

//====================
// receberListaDoGM - GM expõe sua lista de macros para todos os clientes
//====================
console.log(`${prefixo} Registrando função: receberListaDoGM`);

SocketLink.register("receberListaDoGM", async ({ gmId, lista }) => {
  try {
    window.icrListaGM = lista;
    logDebug(`${prefixo} [receberListaDoGM] Lista do GM (${gmId}) recebida e armazenada em cache local`);
    return true;
  } catch (erro) {
    console.error(`${prefixo} [receberListaDoGM] Erro ao processar lista do GM:`, erro);
    return false;
  }
});

console.log(`${prefixo} Função registrada com sucesso: receberListaDoGM`);

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