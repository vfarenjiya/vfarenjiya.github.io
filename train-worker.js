// Web Worker: trains the AI without freezing the UI

class HeadlessSnake {
    constructor(size = 20) { this.size = size; this.reset(); }

    reset() {
        const mid = Math.floor(this.size / 2);
        this.snake = [{ x: mid, y: mid }];
        this.dx = 0; this.dy = 0;
        this.food = this.spawnFood();
        this.gameOver = false;
        this.stepsSinceFood = 0;
    }

    spawnFood() {
        let f, tries = 0;
        do {
            f = { x: Math.floor(Math.random()*this.size), y: Math.floor(Math.random()*this.size) };
            tries++;
        } while (this.snake.some(s => s.x===f.x && s.y===f.y) && tries < 100);
        return f;
    }

    isBlocked(x, y, ignoreHead) {
        if (x<0||x>=this.size||y<0||y>=this.size) return true;
        const body = ignoreHead ? this.snake.slice(1) : this.snake;
        return body.some(s => s.x===x && s.y===y);
    }

    move(dir) {
        if (this.gameOver) return 0;
        const dirs = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
        const [dx, dy] = dirs[dir];
        if (this.snake.length>1 && dx===-this.dx && dy===-this.dy) return -0.5;
        this.dx = dx; this.dy = dy;
        const head = { x: this.snake[0].x+dx, y: this.snake[0].y+dy };
        if (this.isBlocked(head.x, head.y, true)) { this.gameOver = true; return -10; }
        this.snake.unshift(head);
        this.stepsSinceFood++;
        let reward = -0.05;
        if (head.x===this.food.x && head.y===this.food.y) {
            this.food = this.spawnFood();
            this.stepsSinceFood = 0;
            reward = 10;
        } else this.snake.pop();
        if (this.stepsSinceFood > this.size*this.size) { this.gameOver = true; return -5; }
        return reward;
    }

    getState() {
        const h = this.snake[0];
        return [
            this.isBlocked(h.x,h.y-1)?1:0, this.isBlocked(h.x,h.y+1)?1:0,
            this.isBlocked(h.x-1,h.y)?1:0, this.isBlocked(h.x+1,h.y)?1:0,
            this.food.x<h.x?1:0, this.food.x>h.x?1:0,
            this.food.y<h.y?1:0, this.food.y>h.y?1:0,
            this.dx===0&&this.dy===-1?1:0, this.dx===0&&this.dy===1?1:0,
            this.dx===-1?1:0, this.dx===1?1:0
        ];
    }

    getSafeActions() {
        const h = this.snake[0];
        return ['UP','DOWN','LEFT','RIGHT'].filter(d => {
            const dirs = { UP:[0,-1], DOWN:[0,1], LEFT:[-1,0], RIGHT:[1,0] };
            const [dx,dy] = dirs[d];
            if (this.snake.length>1 && dx===-this.dx && dy===-this.dy) return false;
            return true;
        });
    }
}

let agent = {
    qTable: new Map(), alpha: 0.15, gamma: 0.92,
    epsilon: 1.0, minEpsilon: 0.01, decay: 0.997,
    actions: ['UP','DOWN','LEFT','RIGHT'],
    key(s){ return s.join(''); },
    getQ(s){ const k=this.key(s); if(!this.qTable.has(k)){ const q={}; this.actions.forEach(a=>q[a]=0); this.qTable.set(k,q);} return this.qTable.get(k); },
    choose(s, valid){
        if (Math.random() < this.epsilon) return valid[Math.floor(Math.random()*valid.length)];
        const q = this.getQ(s); let best=valid[0], bv=-Infinity;
        for (const a of valid) if (q[a]>bv){ bv=q[a]; best=a; }
        return best;
    }
};

let running = false;

self.onmessage = function(e) {
    const { type, config } = e.data;
    if (type === 'start') { running = true; train(config); }
    if (type === 'stop') running = false;
    if (type === 'load') {
        const data = JSON.parse(config.data);
        agent.qTable = new Map(data.qTable);
        agent.epsilon = data.epsilon;
    }
};

function train(config) {
    const totalEpisodes = config.episodes || 500;
    const game = new HeadlessSnake(config.gridSize || 20);
    let episode = 0;
    let recentRewards = [];

    function runEpisode() {
        if (!running || episode >= totalEpisodes) {
            running = false;
            self.postMessage({ type: 'done', qData: JSON.stringify({
                qTable: [...agent.qTable.entries()], epsilon: agent.epsilon, episodes: episode
            })});
            return;
        }

        game.reset();
        let totalReward = 0, steps = 0;
        const maxSteps = 500;

        while (!game.gameOver && steps < maxSteps) {
            const state = game.getState();
            const valid = game.getSafeActions();
            const action = agent.choose(state, valid);
            const reward = game.move(action);
            totalReward += reward;
            const nextState = game.getState();
            const nextValid = game.getSafeActions();

            // Q-update
            const q = agent.getQ(state);
            const nq = agent.getQ(nextState);
            let maxNext = -Infinity;
            for (const a of nextValid) maxNext = Math.max(maxNext, nq[a]);
            if (maxNext === -Infinity) maxNext = 0;
            q[action] += agent.alpha * (reward + agent.gamma * maxNext - q[action]);

            steps++;
        }

        agent.epsilon = Math.max(agent.minEpsilon, agent.epsilon * agent.decay);
        recentRewards.push(totalReward);
        if (recentRewards.length > 50) recentRewards.shift();
        episode++;

        if (episode % 5 === 0 || episode === totalEpisodes) {
            const avg = recentRewards.reduce((a,b)=>a+b,0) / recentRewards.length;
            self.postMessage({
                type: 'progress',
                episode, totalEpisodes,
                epsilon: agent.epsilon,
                avgReward: avg
            });
        }

        setTimeout(runEpisode, 0);
    }

    runEpisode();
}