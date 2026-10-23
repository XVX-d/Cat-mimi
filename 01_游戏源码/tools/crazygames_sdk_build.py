"""Build-only SDK wiring; never modifies shared/WeChat runtime sources."""
import re, json

def sdk_transform(name, s):
    # Dynamic script loading occurs after the real DOM event.
    s=s.replace('"DOMContentLoaded"', '"cg-game-ready"')
    if name.endswith(("saveSystem.js","settingsSystem.js","localizationSystem.js")):
        s=s.replace("root.localStorage","window.CGBridge.storage")
        s=re.sub(r"(?<![.\w])localStorage\b","window.CGBridge.storage",s)
    if name.endswith("platformSystem.js"):
        s=s.replace('/* Basic Launch: browser lifecycle, no SDK. */',
                    'if(root.CGBridge.active)return "crazygames";')
        # Keep browser pause events, but do not send focus changes to the SDK.
        s=s.replace('if (state.ready && state.playing) safeCall("gameplayStop");\n    state.playing = false;',
                    '/* SDK handles focus; preserve reported playing state. */')
        s=s.replace('if (state.ready && state.wantsPlaying) { safeCall("gameplayStart"); state.playing = true; }',
                    'if (state.ready && state.wantsPlaying && !state.playing) { safeCall("gameplayStart"); state.playing = true; }')
        s=s.replace('events.on(events.EVENTS.MAP_ENTERED, gameplayStart);','')
        s += '\nwindow.CatFishGame.PlatformSystem.register("crazygames",window.CGBridge.adapter);\n'
    if name.endswith("game.js"):
        s=s.replace('const started=startCast();','const started=startCast();\n    if(started)window.CatFishGame.PlatformSystem.gameplayStart();')
        s=s.replace('_masterGain.connect(_ac.destination);',
                    '_masterGain.connect(window.CGBridge.audioDestination(_ac));')
    if name.endswith("harvestPresentationSystem.js"):
        s=s.replace('g.connect(audioCtx.destination)','g.connect(window.CGBridge.audioDestination(audioCtx))')
    return s

def sdk_html(html, read, emit):
    scripts=re.findall(r'<script defer src="([^"]+)"></script>',html)
    html=re.sub(r'<script defer src="[^"]+"></script>',"",html)
    emit("scripts/cg-bootstrap.js",read("tools/crazygames_bootstrap.js"))
    return html.replace("</body>",'<script>window.CG_GAME_SCRIPTS='+json.dumps(scripts)+';</script><script defer src="scripts/cg-bootstrap.js"></script></body>')
