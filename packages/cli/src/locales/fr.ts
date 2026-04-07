export const fr = {
  // session
  'session.notLoggedIn': 'Non connecté. Lance: mibridge login',

  // login
  'login.description': 'Se connecter au compte Xiaomi (OTP supporté)',
  'login.option.region': 'Région cloud Xiaomi',
  'login.prompt.username': 'Email / téléphone Xiaomi:',
  'login.prompt.password': 'Mot de passe:',
  'login.2fa.required': '\nVérification 2FA requise.',
  'login.2fa.openLink': 'Ouvrez ce lien dans votre navigateur pour recevoir le code:',
  'login.2fa.doNotValidate': 'Ne validez PAS sur la page web — revenez ici et entrez le code.\n',
  'login.2fa.prompt': 'Code de vérification:',
  'login.2fa.tooManyAttempts': 'Trop de tentatives.',
  'login.2fa.failed': 'Échec ({message}), réessaie.',
  'login.success': 'Connecté. Session sauvegardée.',
  'login.error': 'Échec de connexion: {message}',

  // logout
  'logout.description': 'Supprimer la session locale',
  'logout.success': 'Session supprimée.',

  // devices
  'devices.description': 'Lister tous les appareils du compte',
  'devices.none': 'Aucun appareil trouvé.',
  'devices.header.id': 'ID',
  'devices.header.model': 'Modèle',
  'devices.header.name': 'Nom',
  'devices.error': 'Erreur: {message}',

  // status
  'status.description': "Afficher l'état d'un appareil",
  'status.header': '\nÉtat du vacuum:',
  'status.error': 'Erreur: {message}',

  // do
  'do.description': 'Déclencher une action ({actions})',
  'do.success': '✓ {action} envoyé',
  'do.unknownAction': 'Action inconnue: {action}. Disponibles: {actions}',
  'do.error': 'Erreur: {message}',

  // clean
  'clean.description': 'Lancer un nettoyage ciblé',
  'clean.option.rooms': 'IDs de pièces séparés par virgule (ex: 1,2,3)',
  'clean.option.mode': 'vacuum|mop|vacuumThenMop',
  'clean.option.suction': 'quiet|standard|strong|turbo',
  'clean.option.water': 'low|medium|high',
  'clean.option.repeat': 'Nombre de passages',
  'clean.rooms.success': '✓ Nettoyage pièces [{ids}] lancé',
  'clean.full.success': '✓ Nettoyage complet lancé',
  'clean.error': 'Erreur: {message}',

  // rooms
  'rooms.description': 'Lister les pièces configurées',
  'rooms.header': '\nPièces:',
  'rooms.none': 'Aucune pièce configurée (lance un nettoyage complet pour cartographier).',
  'rooms.hint': '\nPour nettoyer: mibridge clean {deviceId} --rooms <id1,id2,...>\n',
  'rooms.error': 'Erreur: {message}',

  // maps
  'maps.description': 'Lister les cartes disponibles',
  'maps.none': 'Aucune carte disponible.',
  'maps.map': '\nCarte: {name} (ID: {id})',
  'maps.error': 'Erreur: {message}',

  // watch
  'watch.description': "Surveiller l'état en temps réel (Ctrl+C pour quitter)",
  'watch.option.interval': 'Intervalle de polling en ms',
  'watch.intro': 'Surveillance de {deviceId} (intervalle {interval}ms) — Ctrl+C pour quitter\n',
  'watch.status': '[{time}] state={state} battery={battery}% mode={mode}',
  'watch.stateChange': '  → state: {state}',
  'watch.modeChange': '  → cleanMode: {mode}',
  'watch.operationComplete': '  ✓ Mission terminée — erreur: {error}, durée: {duration}s',
  'watch.error': '  ✗ Erreur: {message}',

  // fountain
  'fountain.description': 'Gérer une fontaine à eau connectée Xiaomi',
  'fountain.status.description': "Afficher l'état actuel de la fontaine",
  'fountain.status.header': '\nÉtat de la fontaine:',
  'fountain.on.description': 'Allumer la pompe',
  'fountain.on.success': '✓ Pompe allumée',
  'fountain.off.description': 'Éteindre la pompe',
  'fountain.off.success': '✓ Pompe éteinte',
  'fountain.setMode.description': 'Définir le mode de distribution (continuous|intermittent|sensor)',
  'fountain.setMode.success': '✓ Mode défini sur {mode}',
  'fountain.setMode.invalid': 'Mode invalide: {mode}. Valides: continuous, intermittent, sensor',
  'fountain.resetFilter.description': 'Remettre le compteur de filtre à 100%',
  'fountain.resetFilter.success': '✓ Compteur filtre réinitialisé',
  'fountain.watch.description': "Surveiller la fontaine en temps réel (Ctrl+C pour quitter)",
  'fountain.watch.option.interval': 'Intervalle de polling en ms (défaut: 30000)',
  'fountain.watch.intro': 'Surveillance fontaine {deviceId} (intervalle {interval}ms) — Ctrl+C pour quitter\n',
  'fountain.watch.status': '[{time}] on={on} mode={mode} batterie={battery}% filtre={filter}%',
  'fountain.watch.faultChange': '  ⚠ panne: {fault}',
  'fountain.watch.waterShortage': "  ⚠ manque d'eau: {shortage}",
  'fountain.watch.modeChange': '  → mode: {mode}',
  'fountain.error': 'Erreur: {message}',
} as const
