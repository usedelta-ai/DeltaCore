"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionUsecasesImpl = void 0;
class EvolutionUsecasesImpl {
    evolution;
    constructor(evolution) {
        this.evolution = evolution;
    }
    async getEvolutionInstances(user) {
        if (user.role === 'employee')
            throw new Error('Unauthorized');
        return this.evolution.fetchInstances();
    }
    async getEvolutionConnectionState(user, instanceName) {
        if (user.role === 'employee')
            throw new Error('Unauthorized');
        return this.evolution.connectionState(instanceName);
    }
    async connectEvolution(user, instanceName) {
        if (user.role === 'employee')
            throw new Error('Unauthorized');
        return this.evolution.connect(instanceName);
    }
    async getBase64FromMediaMessage(instanceName, messageId) {
        return this.evolution.getBase64FromMediaMessage(instanceName, messageId);
    }
}
exports.EvolutionUsecasesImpl = EvolutionUsecasesImpl;
