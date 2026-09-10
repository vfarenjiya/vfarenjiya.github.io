class QLearningAgent {
    constructor() {
        this.qTable = new Map();
        this.alpha = 0.15;          // learning rate
        this.gamma = 0.92;          // discount
        this.epsilon = 1.0;         // exploration
        this.minEpsilon = 0.01;
        this.epsilonDecay = 0.997;
        this.actions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        this.episodes = 0;
        this.rewardHistory = [];
    }

    key(state) { return state.join(''); }

    getQ(state) {
        const k = this.key(state);
        if (!this.qTable.has(k)) {
            const q = {};
            this.actions.forEach(a => q[a] = 0);
            this.qTable.set(k, q);
        }
        return this.qTable.get(k);
    }

    choose(state, validActions, forceExplore = false) {
        if (forceExplore || Math.random() < this.epsilon) {
            return validActions[Math.floor(Math.random() * validActions.length)];
        }
        const q = this.getQ(state);
        let best = validActions[0], bestVal = -Infinity;
        for (const a of validActions) {
            if (q[a] > bestVal) { bestVal = q[a]; best = a; }
        }
        return best;
    }

    learn(state, action, reward, nextState, nextActions) {
        const q = this.getQ(state);
        const nextQ = this.getQ(nextState);
        let maxNext = -Infinity;
        for (const a of nextActions) maxNext = Math.max(maxNext, nextQ[a]);
        if (maxNext === -Infinity) maxNext = 0;
        q[action] += this.alpha * (reward + this.gamma * maxNext - q[action]);
    }

    decay() {
        this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    }

    record(reward) {
        this.episodes++;
        this.rewardHistory.push(reward);
        if (this.rewardHistory.length > 200) this.rewardHistory.shift();
    }

    avgReward() {
        if (!this.rewardHistory.length) return 0;
        return this.rewardHistory.reduce((a,b) => a+b, 0) / this.rewardHistory.length;
    }

    serialize() {
        return JSON.stringify({
            qTable: [...this.qTable.entries()],
            epsilon: this.epsilon,
            episodes: this.episodes
        });
    }

    deserialize(str) {
        try {
            const data = JSON.parse(str);
            this.qTable = new Map(data.qTable);
            this.epsilon = data.epsilon;
            this.episodes = data.episodes || 0;
            return true;
        } catch (e) { return false; }
    }
}