// ==============================
// Relink Automático (com SocketLib)
// ==============================
console.log(`I Choose Roll! - [Relink] 1.0.0.1 Iniciando carregamento de variáveis`);

const prefixo = "I Choose Roll! - [Relink]";
const logo = `<img src="modules/i-choose-roll/assets/logo.png" alt="logo" width="32" height="32" style="vertical-align:middle;margin:0 4px 0 0;display:inline-block;">`;
const compendium = "i-choose-roll.choose-roll-system-bindings";
const mID = "i-choose-roll";

// modo debug
const logDebug = (...args) => {
	const fn = window?.logDebug ?? (() => {});
	return fn(...args);
};

const UIDebug = (mensagem) => {
  if (game.settings.get(mID, "modoDebug"))
    ui.notifications.info(`${logo} ${mensagem}`);
};

let socket;

// REGISTRO NO SOCKETLIB
Hooks.once("socketlib.ready", () => {
	console.log(`${prefixo} Registrando módulo e função no SocketLib...`);
	socket = socketlib.registerModule(mID);
	socket.register("executarRelinkComoGM", executarRelinkComoGM);
	console.log(`${prefixo} Registro concluído.`);
});

// READY — Executa a função após 5s (como no original)
Hooks.once("ready", async () => {
	
	// Apenas o primeiro GM ativo executa
	if (!game.user.isGM) return;
	
	// Evita execução duplicada por múltiplos GMs (se houver mais de um)
	if (game.__RELINK_RAN__) return;
	game.__RELINK_RAN__ = true;
	
	setTimeout(async () => {
		logDebug(`${prefixo} Disparando relink como GM...`);
		await executarRelinkComoGM();
	}, 5000);
});

// FUNÇÃO PRINCIPAL — Restaurar vínculos
async function executarRelinkComoGM() {
	logDebug(`${prefixo} Executando relink como GM...`);
	UIDebug(`Iniciando restauração automática de vínculos...`);
	game.tokenAttacherGhostHooks ??= {};
	
	const pack = game.packs.get(compendium);
	if (!pack) return ui.notifications.error(`${logo} Compendium "${compendium}" não encontrado.`);
	let destravou = false;
	
	if (pack.locked) {
		logDebug(`${prefixo} Compêndio destravado temporariamente.`);
		await pack.configure({ locked: false });
		destravou = true;
	}
	
	const backups = await pack.getDocuments();
	const deletedBackups = [];
	const deletedByScene = [];
	const deletedByTokens = [];
	
	for (const b of backups) {
		const raw = b.system.description.value;
		const match = raw.match(/<pre>(.*?)<\/pre>/s);
		if (!match) continue;
		
		try {
			const data = JSON.parse(match[1]);
			
			if (data.worldId !== game.world.id) {
				logDebug(`${prefixo} Backup "${b.name}" ignorado (outro mundo).`);
				continue;
			}
			
			const scene = game.scenes.get(data.sceneId);
			
			if (!scene && game.user.isGM) {
				await b.delete();
				deletedBackups.push(b.name);
				deletedByScene.push(b.name);
				console.warn(`${prefixo} Backup órfão "${b.name}" removido (cena inexistente).`);
				continue;
			}
			
			const tokenIdsToCheck = [data.cavaleiroId, data.mountId, data.secondaryId, data.primaryId].filter(Boolean);
			const tokensInScene = new Set(scene?.tokens?.keys() ?? []);
			const anyMissing = tokenIdsToCheck.some(id => !tokensInScene.has(id));
			
			if (anyMissing && game.user.isGM) {
				await b.delete();
				deletedBackups.push(b.name);
				deletedByTokens.push([scene.name, b.name]);
				console.warn(`${prefixo} Backup inválido "${b.name}" removido (token ausente).`);
			}
			
		} catch (e) {
			console.warn(`${prefixo} Erro ao processar backup "${b.name}"`, e);
		}
	}
	
	for (const scene of game.scenes) {
		
		for (const tokenDoc of scene.tokens.contents) {
			const actor = tokenDoc.actor;
			if (!actor) continue;
			
			for (const b of backups) {
				const raw = b.system.description.value;
				const match = raw.match(/<pre>(.*?)<\/pre>/s);
				if (!match) continue;
				
				try {
					
					const data = JSON.parse(match[1]);
					if (data.worldId !== game.world.id) continue;
					if (data.sceneId !== scene.id) continue;
					
					const tokenUUID = tokenDoc?.uuid;
					const cavaleiroMatch = data.cavaleiroUUID === tokenUUID || data.cavaleiroId === tokenDoc.id;
					const secondaryMatch = data.secondaryId === tokenDoc.id;
					if (!(cavaleiroMatch || secondaryMatch)) continue;
					
					const mountToken = await fromUuid(data.mountUuid ?? data.primaryUuid);
					if (!mountToken) continue;
					
					const linkId = `link-${data.sceneId}-${tokenDoc.id}-${mountToken.id}`;
					
					if (!game.tokenAttacherGhostHooks[linkId]) {
						
						const hookId = Hooks.on("updateToken", (updated, changes) => {
							if (updated.id !== mountToken.id) return;
							
							const dx = (changes.x ?? updated.x) + (data.offsetX ?? -canvas.grid.size * 0.25);
							const dy = (changes.y ?? updated.y) + (data.offsetY ?? -canvas.grid.size * 0.25);
							const rotation = (changes.rotation ?? updated.rotation) + (data.rotationDelta ?? 0);
							const elevation = (changes.elevation ?? updated.elevation) + (data.elevationDelta ?? 0);
							const sort = (changes.sort ?? updated.sort) + (data.sortDelta ?? 1);
							tokenDoc.update({ x: dx, y: dy, rotation, elevation, sort });
						});
						
						game.tokenAttacherGhostHooks[linkId] = hookId;
						data.hookId = hookId;
						
						const updated = raw.replace(/<pre>(.*?)<\/pre>/s, `<pre>${JSON.stringify(data, null, 2)}</pre>`);
						await b.update({ "system.description.value": updated });
						await mountToken.update({ x: mountToken.x + 0 });
						logDebug(`${prefixo} [${scene.name}] ${actor.name}: Hook restaurado.`);
						UIDebug(`[${scene.name}] ${actor.name}: vínculo restaurado.`);
					}
					
				} catch (e) {
					console.warn(`${prefixo} Erro ao restaurar backup "${b.name}"`, e);
				}
			}
		}
	}
	
	if (deletedBackups.length > 0 && game.user.isGM) {
		
		const buildSceneGroupedList = (group) => {
			
			const grouped = group.reduce((acc, entry) => {
				const [sceneName, name] = entry;
				acc[sceneName] ??= [];
				acc[sceneName].push(name);
				return acc;
			}, {});
			return Object.entries(grouped).map(([scene, names]) => `<p><strong>${scene}</strong></p><ul>${names.map(n => `<li>${n}</li>`).join("")}</ul>`).join("");
		};
		
		const msg = `
			<p>${logo}<strong> I Choose Roll! </strong> Os arquivos foram purificados.</p>
			<p>Foram removidos <strong>${deletedBackups.length}</strong> backup(s) inválidos:</p>
			${deletedByScene.length ? `<p><strong>Cena inexistente:</strong></p><ul>${deletedByScene.map(n => `<li>${n}</li>`).join("")}</ul>` : ""}
			${deletedByTokens.length ? `<p><strong>Token(s) ausente(s):</strong></p>${buildSceneGroupedList(deletedByTokens)}` : ""}
			<p><em>Agora os registros estão limpos e sem corrupção arcana.</em></p>
		`;	
		
		ChatMessage.create({
			content: msg,
			whisper: [game.user.id],
			type: CONST.CHAT_MESSAGE_TYPES.OTHER
		});
	}
	
	if (destravou) {
		logDebug(`${prefixo} Re-travando o compêndio...`);
		await pack.configure({ locked: true });
	}
	
	logDebug(`${prefixo} Restauração concluída.`);
	UIDebug(`Restauração de vínculos finalizada.`);
}