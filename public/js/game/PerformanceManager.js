(function () {

  function fix() {
    if (!window.game || !window.game.scene || !window.game.isRunning) return;

    var g = window.game;
    var scene = g.scene;
    var renderer = g.renderer;

    console.log('🔧 PERFORMANCE FIX STARTING...');

    // ==============================
    // 1. REDUCE PIXEL RATIO
    // ==============================
    renderer.setPixelRatio(1);

    // ==============================
    // 2. DISABLE ALL SHADOWS
    // ==============================
    renderer.shadowMap.enabled = false;

    scene.traverse(function (obj) {
      if (obj.castShadow) obj.castShadow = false;
      if (obj.receiveShadow) obj.receiveShadow = false;
    });

    // ==============================
    // 3. REMOVE 80% OF TREES
    // ==============================
    if (g.forest && g.forest.trees) {
      var trees = g.forest.trees;
      var keep = Math.min(trees.length, 150);
      var removeCount = 0;

      // Keep only nearest 150 trees to center
      trees.sort(function (a, b) {
        var da = a.position.x * a.position.x + a.position.z * a.position.z;
        var db = b.position.x * b.position.x + b.position.z * b.position.z;
        return da - db;
      });

      for (var i = trees.length - 1; i >= keep; i--) {
        scene.remove(trees[i]);
        trees[i].traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        });
        removeCount++;
      }

      g.forest.trees = trees.slice(0, keep);
      console.log('🌲 Removed ' + removeCount + ' trees. Keeping ' + keep);
    }

    // ==============================
    // 4. REMOVE 70% OF ROCKS
    // ==============================
    if (g.forest && g.forest.rocks) {
      var rocks = g.forest.rocks;
      var keepRocks = Math.min(rocks.length, 30);

      for (var i = rocks.length - 1; i >= keepRocks; i--) {
        scene.remove(rocks[i]);
        rocks[i].traverse(function (child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      }

      g.forest.rocks = rocks.slice(0, keepRocks);
      console.log('🪨 Removed rocks. Keeping ' + keepRocks);
    }

    // ==============================
    // 5. REMOVE ALL FOG PARTICLES
    // ==============================
    if (g.forest && g.forest.fogParticles) {
      g.forest.fogParticles.forEach(function (fog) {
        scene.remove(fog);
        if (fog.geometry) fog.geometry.dispose();
        if (fog.material) fog.material.dispose();
      });
      g.forest.fogParticles = [];
      console.log('🌫️ Removed all fog particles');
    }

    // ==============================
    // 6. REMOVE ITEM LIGHTS
    // ==============================
    if (g.forest && g.forest.itemMeshes) {
      g.forest.itemMeshes.forEach(function (mesh) {
        var toRemove = [];
        mesh.children.forEach(function (child) {
          if (child.isPointLight) toRemove.push(child);
          if (child.isMesh && child.geometry &&
              child.geometry.type === 'SphereGeometry' &&
              child.material && child.material.transparent) {
            toRemove.push(child);
          }
        });
        toRemove.forEach(function (child) { mesh.remove(child); });
      });
      console.log('💡 Removed item lights and glows');
    }

    // ==============================
    // 7. REDUCE STARS
    // ==============================
    if (g.dayNightCycle && g.dayNightCycle.stars) {
      scene.remove(g.dayNightCycle.stars);
      if (g.dayNightCycle.stars.geometry) g.dayNightCycle.stars.geometry.dispose();
      if (g.dayNightCycle.stars.material) g.dayNightCycle.stars.material.dispose();
      g.dayNightCycle.stars = { material: { opacity: 0 } };
      console.log('⭐ Removed stars');
    }

    // ==============================
    // 8. DISABLE RAIN
    // ==============================
    if (g.weatherSystem && g.weatherSystem.rainParticles) {
      scene.remove(g.weatherSystem.rainParticles);
      if (g.weatherSystem.rainParticles.geometry) g.weatherSystem.rainParticles.geometry.dispose();
      if (g.weatherSystem.rainParticles.material) g.weatherSystem.rainParticles.material.dispose();

      g.weatherSystem.rainParticles = null;
      g.weatherSystem.update = function () {};
      g.weatherSystem.setWeather = function () {};

      console.log('🌧️ Disabled rain');
    }

    // ==============================
    // 9. SIMPLIFY FOG
    // ==============================
    if (scene.fog) {
      scene.fog = new THREE.FogExp2(0x000000, 0.02);
    }

    // ==============================
    // 10. REMOVE MONSTER LIGHTS
    // ==============================
    var origCreateMonster = null;
    if (g.monsterManager) {
      g.monsterManager.monsters.forEach(function (monster) {
        var toRemove = [];
        monster.group.children.forEach(function (child) {
          if (child.isPointLight) toRemove.push(child);
        });
        toRemove.forEach(function (child) { monster.group.remove(child); });
      });

      // Patch future monster creation to skip lights
      var origCreate = g.monsterManager.createMonster.bind(g.monsterManager);
      g.monsterManager.createMonster = function (data) {
        origCreate(data);
        var monster = this.monsters.get(data.id);
        if (monster) {
          var rem = [];
          monster.group.children.forEach(function (c) {
            if (c.isPointLight) rem.push(c);
          });
          rem.forEach(function (c) { monster.group.remove(c); });
        }
      };

      console.log('👾 Removed monster lights');
    }

    // ==============================
    // 11. REMOVE CAMPFIRE LIGHTS WHEN FAR
    // ==============================
    if (g.campfireManager) {
      g.campfireManager.campfires.forEach(function (cf) {
        // Remove fire particles (just keep the light)
        cf.fireParticles.forEach(function (p) {
          cf.group.remove(p);
          if (p.geometry) p.geometry.dispose();
          if (p.material) p.material.dispose();
        });
        cf.fireParticles = [];
      });
      console.log('🔥 Simplified campfires');
    }

    // ==============================
    // 12. REDUCE SKY QUALITY
    // ==============================
    if (g.dayNightCycle && g.dayNightCycle.sky) {
      var sky = g.dayNightCycle.sky;
      scene.remove(sky);
      if (sky.geometry) sky.geometry.dispose();

      var newSkyGeo = new THREE.SphereGeometry(500, 8, 8);
      sky.geometry = newSkyGeo;
      scene.add(sky);
      console.log('🌌 Reduced sky quality');
    }

    // ==============================
    // 13. REDUCE DIRECTIONAL LIGHT SHADOW
    // ==============================
    if (g.dayNightCycle && g.dayNightCycle.sunLight) {
      g.dayNightCycle.sunLight.castShadow = false;
    }

    // ==============================
    // 14. LIMIT COLLIDERS
    // ==============================
    if (g.forest && g.forest.colliders) {
      if (g.forest.colliders.length > 200) {
        g.forest.colliders = g.forest.colliders.slice(0, 200);
        console.log('⚡ Reduced colliders to 200');
      }
    }

    // ==============================
    // 15. THROTTLE FOREST UPDATE
    // ==============================
    if (g.forest) {
      var origForestUpdate = g.forest.update.bind(g.forest);
      var forestUpdateCounter = 0;

      g.forest.update = function (delta, timeOfDay) {
        forestUpdateCounter++;
        if (forestUpdateCounter % 5 === 0) {
          origForestUpdate(delta, timeOfDay);
        }
      };
      console.log('🌲 Throttled forest updates');
    }

    // ==============================
    // 16. THROTTLE CAMPFIRE UPDATE
    // ==============================
    if (g.campfireManager) {
      var origCfUpdate = g.campfireManager.update.bind(g.campfireManager);
      var cfCounter = 0;

      g.campfireManager.update = function (delta) {
        cfCounter++;
        if (cfCounter % 10 === 0) {
          origCfUpdate(delta);
        }
      };
    }

    // ==============================
    // 17. THROTTLE MINIMAP
    // ==============================
    if (g.minimap) {
      var origMinimap = g.minimap.update.bind(g.minimap);
      var mmCounter = 0;

      g.minimap.update = function () {
        mmCounter++;
        if (mmCounter % 10 === 0) {
          origMinimap.apply(this, arguments);
        }
      };
    }

    // ==============================
    // 18. REDUCE RENDER SIZE
    // ==============================
    var scale = 0.75;
    var w = Math.floor(window.innerWidth * scale);
    var h = Math.floor(window.innerHeight * scale);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // Fix resize
    var origResize = g.onResize.bind(g);
    g.onResize = function () {
      g.camera.aspect = window.innerWidth / window.innerHeight;
      g.camera.updateProjectionMatrix();
      var sw = Math.floor(window.innerWidth * scale);
      var sh = Math.floor(window.innerHeight * scale);
      renderer.setSize(sw, sh, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    };

    // ==============================
    // 19. COUNT WHAT'S LEFT
    // ==============================
    var meshes = 0;
    var lights = 0;
    scene.traverse(function (obj) {
      if (obj.isMesh) meshes++;
      if (obj.isLight) lights++;
    });

    console.log('✅ PERFORMANCE FIX DONE');
    console.log('📊 Scene now: ' + meshes + ' meshes, ' + lights + ' lights');

    // ==============================
    // 20. FPS COUNTER
    // ==============================
    var fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.cssText = 'position:fixed;bottom:5px;left:5px;z-index:9999;color:#00ff44;font-size:12px;font-family:monospace;background:rgba(0,0,0,0.5);padding:3px 8px;border-radius:3px;pointer-events:none;';
    document.body.appendChild(fpsDiv);

    var frames = 0;
    var lastTime = performance.now();

    function countFps() {
      frames++;
      var now = performance.now();
      if (now - lastTime >= 1000) {
        fpsDiv.textContent = 'FPS: ' + frames;
        fpsDiv.style.color = frames > 40 ? '#00ff44' : frames > 25 ? '#ffaa00' : '#ff4444';
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(countFps);
    }
    countFps();
  }

  // ==============================
  // WAIT FOR GAME THEN FIX
  // ==============================
  var attempts = 0;
  var checker = setInterval(function () {
    attempts++;
    if (attempts > 120) {
      clearInterval(checker);
      return;
    }

    if (window.game && window.game.isRunning && window.game.scene && window.game.forest && window.game.forest.trees && window.game.forest.trees.length > 0) {
      clearInterval(checker);

      // Wait a bit more for everything to load
      setTimeout(fix, 2000);
    }
  }, 500);

})();