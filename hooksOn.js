function registrarSincroniaDeVoo() {
  // Badge -> Elevação
  Hooks.on("updateItem", async (item, changes) => {
    if (item.type !== "effect" || item.slug !== "voo") return;
    if (!foundry.utils.hasProperty(changes, "system.badge.value")) return;

    const badgeValue = Number(getProperty(changes, "system.badge.value"));
    if (isNaN(badgeValue)) return;

    const elevation = (badgeValue - 1) * 5;
    const actor = item.parent;
    const tokens = actor.getActiveTokens().filter(t => t.isOwner);

    for (const token of tokens) {
      await token.document.update({ elevation });
    }
  });

  // Elevação -> Badge
  Hooks.on("updateToken", async (tokenDoc, changes) => {
    if (!("elevation" in changes)) return;
	if (!tokenDoc.isOwner) return;

    const elevation = changes.elevation;
    const actor = tokenDoc.actor;
    if (!actor) return;

    const effect = actor.itemTypes.effect.find(e => e.slug === "voo");
    if (!effect) return;

    const newBadgeValue = Math.floor(elevation / 5) + 1;
    if (effect.system.badge.value === newBadgeValue) return;

    await effect.update({ "system.badge.value": newBadgeValue });
  });
  
  // Prone durante o voo
Hooks.on("createItem", async (item) => {
  if (item.type !== "condition" || item.slug !== "prone") return;
  const actor = item.parent;
  if (!actor) return;

  // Garantir que apenas o dono do ator veja o diálogo

//====================
// Filtro de permissões para exibir o diálogo
//====================

// ignora atores que não sejam personagem ou criatura
if (!["character", "npc"].includes(actor.type)) return;

// filtra apenas jogadores não-GMs com permissão OWNER e online
const donosNaoGMsOnline = game.users.players.filter(u =>
  !u.isGM &&
  u.active && // apenas usuários conectados
  actor.testUserPermission(u, "OWNER")
);

// caso 1: exatamente 1 dono não-GM online — mostra apenas para ele
if (donosNaoGMsOnline.length === 1) {
  if (game.user.id !== donosNaoGMsOnline[0].id) return;
}

// caso 2: nenhum ou múltiplos donos online — mostra apenas para o GM
else {
  if (!game.user.isGM) return;
}



  const flyingEffect = actor.itemTypes.effect.find(e => e.slug === "voo");
  if (!flyingEffect) return;

    try {
      const useReaction = await Dialog.confirm({
        title: "Flying Maneuver",
        content: "<p>Usar reação para evitar cair do voo?</p>",
        defaultYes: false,
      });

      const tokens = actor.getActiveTokens();
      if (tokens.length === 0) return;

      const token = tokens[0];
      const oldElevation = token.document.elevation;

      if (useReaction) {
        const saveRoll = await actor.saves.reflex.roll({ dc: 15, skipDialog: true });
        if (saveRoll.total >= 15) {
          await item.delete();
          await pedirNovaElevacao(token, flyingEffect, oldElevation, false, actor);
        } else {
          await pedirNovaElevacao(token, flyingEffect, oldElevation, true, actor);
          await flyingEffect.delete();
        }
      } else {
        await pedirNovaElevacao(token, flyingEffect, oldElevation, true, actor);
        await flyingEffect.delete();
      }
    } finally {
      game.__processingProne = false;
    }
  });

  async function pedirNovaElevacao(token, flyingEffect, oldElevation, aplicaDano, actor) {
    return new Promise((resolve) => {
      new Dialog({
        title: "Nova Elevação",
        content: `
          <p>Insira a nova elevação (em pés):</p>
          <input id="newElevation" type="number" min="0" step="1" value="${token.document.elevation}">
        `,
        buttons: {
          ok: {
            label: "Confirmar",
            callback: async (html) => {
              const newElevation = parseInt(html.find("#newElevation").val());
              if (isNaN(newElevation) || newElevation < 0) {
                ui.notifications.warn("Elevação inválida.");
                resolve();
                return;
              }
              const fallDistance = oldElevation - newElevation;

              await token.document.update({ elevation: newElevation });

              if (flyingEffect) {
                const newBadge = Math.floor(newElevation / 5) + 1;
                await flyingEffect.update({ "system.badge.value": newBadge });
              }

              if (aplicaDano && fallDistance > 5) {
                const msg = `[[/r (floor(${fallDistance}/2))[bludgeoning]]]`;

                ChatMessage.create({
                  speaker: ChatMessage.getSpeaker({ actor }),
                  content: msg,
                  flavor: `Dano por queda (${fallDistance} pés)`
                });
              }
              resolve();
            }
          },
          cancel: {
            label: "Cancelar",
            callback: () => resolve()
          }
        },
        default: "ok"
      }).render(true);
    });
  }
}


function registrarSemReacaoAuto() {
  Hooks.on("updateCombat", async (combat, changed) => {
    if (!("turn" in changed)) return;
    const combatant = combat.combatant;
    if (!combatant?.actor) return;

    const actor = combatant.actor;
	if (!actor?.testUserPermission(game.user, "OWNER")) return;

    const efeito = actor.itemTypes.effect.find(e => e.slug === "effect-reaction-was-used");
    if (efeito) {
      await efeito.delete();
      console.log(`Efeito "sem-reação" removido de ${actor.name} no início do seu turno.`);
    }
  });
}

// READY AQUI NÃO ESQUECE KITA!
// Ativação do módulo I Choose Roll 
Hooks.once("ready", () => {
  console.log("i-choose-roll | Hooks ativados");

  // Sincroniza efeitos visuais de voo com elevação
  registrarSincroniaDeVoo();

  // Aplica desmontagem automática se não usar reação
  registrarSemReacaoAuto();
});

