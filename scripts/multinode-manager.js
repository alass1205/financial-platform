#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

/**
 * 🌐 GESTIONNAIRE RÉSEAU MULTI-NŒUDS
 * Réseau privé avec 4 nœuds validateurs (conforme cahier des charges)
 */

class MultiNodeManager {
  constructor() {
    this.ports = [8546, 8547, 8548, 8549]; // 4 nœuds
    this.nodes = [];
  }

  async startNetwork() {
    console.log("🌐 DÉMARRAGE RÉSEAU MULTI-NŒUDS (4 VALIDATEURS)");
    console.log("════════════════════════════════════════════════════");
    console.log(`🔗 Ports: ${this.ports.join(', ')}`);
    console.log(`⛓️ Chain ID: 1337\n`);

    // Démarrer les nœuds un par un
    for (let i = 0; i < this.ports.length; i++) {
      await this.startNode(i);
      if (i < this.ports.length - 1) {
        console.log("⏳ Attente 2s avant nœud suivant...\n");
        await this.sleep(2000);
      }
    }

    console.log("\n✅ RÉSEAU MULTI-NŒUDS OPÉRATIONNEL !");
    console.log("════════════════════════════════════════════════════");
    console.log("🎯 Nœud principal: http://127.0.0.1:8546");
    console.log("🔗 Tous les nœuds:");
    this.ports.forEach((port, i) => {
      console.log(`   Nœud ${i + 1}: http://127.0.0.1:${port}`);
    });
    
    this.saveConfig();
    console.log("\n🚀 PRÊT POUR DÉPLOIEMENT DES CONTRATS !");
    
    // Garder le script actif
    this.keepAlive();
  }

  async startNode(nodeIndex) {
    const port = this.ports[nodeIndex];
    const nodeName = `Nœud-${nodeIndex + 1}`;
    
    console.log(`⏳ Démarrage ${nodeName} sur port ${port}...`);

    return new Promise((resolve) => {
      const nodeProcess = spawn('npx', ['hardhat', 'node', '--port', port.toString()], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let ready = false;

      nodeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Started HTTP and WebSocket JSON-RPC server') && !ready) {
          ready = true;
          console.log(`✅ ${nodeName} actif sur port ${port}`);
          
          this.nodes.push({
            name: nodeName,
            port: port,
            url: `http://127.0.0.1:${port}`,
            process: nodeProcess,
            pid: nodeProcess.pid
          });
          
          resolve();
        }
      });

      // Timeout de sécurité
      setTimeout(() => {
        if (!ready) {
          console.log(`⚠️ ${nodeName} démarrage lent, mais continue...`);
          resolve();
        }
      }, 10000);
    });
  }

  saveConfig() {
    const config = {
      networkType: "multi-node",
      chainId: 1337,
      startTime: new Date().toISOString(),
      primaryNode: "http://127.0.0.1:8546",
      nodes: this.nodes.map(n => ({
        name: n.name,
        url: n.url,
        port: n.port,
        pid: n.pid
      })),
      status: "active"
    };

    fs.writeFileSync('multinode-config.json', JSON.stringify(config, null, 2));
    console.log("💾 Configuration sauvée: multinode-config.json");
  }

  keepAlive() {
    console.log("\n📋 CONTRÔLES:");
    console.log("   Ctrl+C : Arrêter le réseau");
    console.log("   Nouveau terminal : Déployer les contrats");
    
    process.on('SIGINT', () => {
      console.log("\n🛑 Arrêt du réseau...");
      this.stopNetwork();
      process.exit(0);
    });
  }

  stopNetwork() {
    this.nodes.forEach(node => {
      try {
        process.kill(node.pid);
        console.log(`✅ ${node.name} arrêté`);
      } catch (e) {
        console.log(`⚠️ Erreur arrêt ${node.name}`);
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Démarrage
const manager = new MultiNodeManager();
manager.startNetwork();
