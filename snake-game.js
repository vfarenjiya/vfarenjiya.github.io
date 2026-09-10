class SnakeGame {
    constructor(canvas, gridSize = 20) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = gridSize;
        this.tileCount = gridSize;
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.reset();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.width * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.displaySize = rect.width;
        this.cell = rect.width / this.tileCount;
    }

    reset() {
        const mid = Math.floor(this.tileCount / 2);
        this.snake = [{ x: mid, y: mid }];
        this.dx = 0; this.dy = 0;
        this.food = this.spawnFood();
        this.score = 0;
        this.gameOver = false;
        this.stepsSinceFood = 0;
        this.particles = [];
    }

    spawnFood() {
        let food, tries = 0;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
            tries++;
        } while (this.snake.some(s => s.x === food.x && s.y === food.y) && tries < 100);
        return food;
    }

    isBlocked(x, y, ignoreHead = false) {
        if (x < 0 || x >= this.tileCount || y < 0 || y >= this.tileCount) return true;
        const body = ignoreHead ? this.snake.slice(1) : this.snake;
        return body.some(s => s.x === x && s.y === y);
    }

    move(dir) {
        if (this.gameOver) return 0;

        const dirs = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
        const [ndx, ndy] = dirs[dir];

        // Prevent reversing
        if (this.snake.length > 1 && ndx === -this.dx && ndy === -this.dy) {
            return -0.5;
        }
        this.dx = ndx; this.dy = ndy;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        if (this.isBlocked(head.x, head.y, true)) {
            this.gameOver = true;
            return -10;
        }

        this.snake.unshift(head);
        this.stepsSinceFood++;

        let reward = -0.05;

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.food = this.spawnFood();
            this.stepsSinceFood = 0;
            reward = 10;
            this.burst(head.x, head.y);
        } else {
            this.snake.pop();
        }

        // Anti-loop
        if (this.stepsSinceFood > this.tileCount * this.tileCount) {
            this.gameOver = true;
            return -5;
        }

        return reward;
    }

    burst(gx, gy) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: (gx + 0.5) * this.cell,
                y: (gy + 0.5) * this.cell,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: `hsl(${Math.random() * 60 + 20}, 90%, 60%)`
            });
        }
    }

    getState() {
        const h = this.snake[0];
        return [
            this.isBlocked(h.x, h.y - 1) ? 1 : 0,
            this.isBlocked(h.x, h.y + 1) ? 1 : 0,
            this.isBlocked(h.x - 1, h.y) ? 1 : 0,
            this.isBlocked(h.x + 1, h.y) ? 1 : 0,
            this.food.x < h.x ? 1 : 0,
            this.food.x > h.x ? 1 : 0,
            this.food.y < h.y ? 1 : 0,
            this.food.y > h.y ? 1 : 0,
            this.dx === 0 && this.dy === -1 ? 1 : 0,
            this.dx === 0 && this.dy === 1 ? 1 : 0,
            this.dx === -1 ? 1 : 0,
            this.dx === 1 ? 1 : 0
        ];
    }

    // Flood fill: count reachable cells from a position
    reachableSpace(startX, startY) {
        const visited = new Set();
        const queue = [[startX, startY]];
        const key = (x, y) => `${x},${y}`;
        while (queue.length) {
            const [x, y] = queue.shift();
            if (this.isBlocked(x, y) || visited.has(key(x, y))) continue;
            visited.add(key(x, y));
            queue.push([x, y-1], [x, y+1], [x-1, y], [x+1, y]);
        }
        return visited.size;
    }

    getSafeActions() {
        const h = this.snake[0];
        const options = [
            { dir: 'UP', dx: 0, dy: -1 },
            { dir: 'DOWN', dx: 0, dy: 1 },
            { dir: 'LEFT', dx: -1, dy: 0 },
            { dir: 'RIGHT', dx: 1, dy: 0 }
        ].filter(o => !(this.snake.length > 1 && o.dx === -this.dx && o.dy === -this.dy));

        return options.map(o => ({
            dir: o.dir,
            safe: !this.isBlocked(h.x + o.dx, h.y + o.dy, true),
            space: this.reachableSpace(h.x + o.dx, h.y + o.dy)
        }));
    }

    draw() {
        const ctx = this.ctx, size = this.displaySize, cell = this.cell;
        ctx.fillStyle = '#0d1226';
        ctx.fillRect(0, 0, size, size);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 1; i < this.tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size);
            ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell);
            ctx.stroke();
        }

        // Food (pulsing)
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc((this.food.x + 0.5) * cell, (this.food.y + 0.5) * cell, (cell / 2.5) * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        this.snake.forEach((seg, i) => {
            const t = i / this.snake.length;
            ctx.fillStyle = i === 0 ? '#0f9d58' : `rgb(${15 + t*20}, ${157 - t*80}, ${88 - t*40})`;
            const pad = i === 0 ? 1 : 2;
            ctx.beginPath();
            ctx.roundRect(seg.x * cell + pad, seg.y * cell + pad, cell - pad*2, cell - pad*2, 4);
            ctx.fill();
        });

        // Particles
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.03;
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1;
        });

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = `bold ${size/12}px sans-serif`;
            ctx.fillText('GAME OVER', size/2, size/2 - 10);
            ctx.font = `${size/20}px sans-serif`;
            ctx.fillText(`Score: ${this.score}`, size/2, size/2 + 25);
        }
    }
}