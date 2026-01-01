// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 650;

// ==================== GAME STATE ====================
let gameState = {
    active: false,
    difficulty: 'easy',
    playerKills: 0,
    botKills: 0,
    targetKills: 20,
    timeLeft: 100,
    totalShots: 0,
    totalHits: 0,
    totalDamage: 0
};

// ==================== PLAYER ====================
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 22,
    color: '#10b981',
    hp: 5600,
    maxHp: 5600,
    speed: 3.5,
    vx: 0,
    vy: 0,
    aimAngle: -Math.PI / 2,
    aimDistance: 90,
    ammo: 3,
    maxAmmo: 3,
    reloading: false,
    canShoot: true,
    shootDelay: 350
};

// ==================== BOT ====================
const bot = {
    x: canvas.width / 2,
    y: 150,
    radius: 22,
    color: '#ef4444',
    hp: 5600,
    maxHp: 5600,
    speed: 2,
    vx: 0,
    vy: 0,
    aimAngle: Math.PI / 2,
    aimDistance: 90,
    ammo: 3,
    maxAmmo: 3,
    reloading: false,
    canShoot: true,
    shootDelay: 1000,
    lastShot: 0,
    moveTimer: 0,
    dodgeTimer: 0
};

// ==================== PROJECTILES ====================
let bullets = [];

// ==================== DIFFICULTY SETTINGS ====================
const difficulties = {
    easy: {
        botSpeed: 1.8,
        botShootDelay: 1800,
        botAccuracy: 0.5,
        botDodgeChance: 0.3,
        botPrediction: 0.3
    },
    medium: {
        botSpeed: 2.5,
        botShootDelay: 1200,
        botAccuracy: 0.75,
        botDodgeChance: 0.6,
        botPrediction: 0.6
    },
    hard: {
        botSpeed: 3.2,
        botShootDelay: 800,
        botAccuracy: 0.95,
        botDodgeChance: 0.85,
        botPrediction: 0.9
    }
};

// ==================== START GAME ====================
function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.active = true;
    gameState.playerKills = 0;
    gameState.botKills = 0;
    gameState.timeLeft = 100;
    gameState.totalShots = 0;
    gameState.totalHits = 0;
    gameState.totalDamage = 0;

    player.x = canvas.width / 2;
    player.y = canvas.height - 150;
    player.hp = player.maxHp;
    player.ammo = player.maxAmmo;
    player.reloading = false;
    player.vx = 0;
    player.vy = 0;

    bot.x = canvas.width / 2;
    bot.y = 150;
    bot.hp = bot.maxHp;
    bot.ammo = bot.maxAmmo;
    bot.reloading = false;
    bot.vx = 0;
    bot.vy = 0;
    bot.lastShot = Date.now();

    const diff = difficulties[difficulty];
    bot.speed = diff.botSpeed;
    bot.shootDelay = diff.botShootDelay;

    bullets = [];
    updateUI();

    document.getElementById('menuScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    startGameTimer();
    gameLoop();
    botAI();
}

function showMenu() {
    gameState.active = false;
    document.getElementById('gameoverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('menuScreen').classList.add('active');
}

// ==================== TIMER ====================
let timerInterval;

function startGameTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameState.active) return;
        
        gameState.timeLeft--;
        const mins = Math.floor(gameState.timeLeft / 60);
        const secs = gameState.timeLeft % 60;
        document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (gameState.timeLeft <= 0) {
            endGame('time');
        }
    }, 1000);
}

// ==================== JOYSTICK ====================
let joystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
};

const joystickOuter = document.getElementById('joystickOuter');
const joystickInner = document.getElementById('joystickInner');

joystickOuter.addEventListener('touchstart', handleJoystickStart);
joystickOuter.addEventListener('mousedown', handleJoystickStart);

document.addEventListener('touchmove', handleJoystickMove);
document.addEventListener('mousemove', handleJoystickMove);

document.addEventListener('touchend', handleJoystickEnd);
document.addEventListener('mouseup', handleJoystickEnd);

function handleJoystickStart(e) {
    e.preventDefault();
    joystick.active = true;
    
    const rect = joystickOuter.getBoundingClientRect();
    joystick.startX = rect.left + rect.width / 2;
    joystick.startY = rect.top + rect.height / 2;
}

function handleJoystickMove(e) {
    if (!joystick.active) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let dx = clientX - joystick.startX;
    let dy = clientY - joystick.startY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 45;

    if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * maxDistance;
        dy = Math.sin(angle) * maxDistance;
    }

    joystick.currentX = dx;
    joystick.currentY = dy;

    joystickInner.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    if (distance > 5) {
        const power = Math.min(distance / maxDistance, 1);
        player.vx = (dx / maxDistance) * player.speed * power;
        player.vy = (dy / maxDistance) * player.speed * power;
    } else {
        player.vx = 0;
        player.vy = 0;
    }
}

function handleJoystickEnd(e) {
    if (!joystick.active) return;
    joystick.active = false;
    joystick.currentX = 0;
    joystick.currentY = 0;
    
    joystickInner.style.transform = 'translate(-50%, -50%)';
    
    player.vx = 0;
    player.vy = 0;
}

// ==================== AIM ====================
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.aimAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    player.aimAngle = Math.atan2(touchY - player.y, touchX - player.x);
});

// ==================== FIRE BUTTON ====================
const fireButton = document.getElementById('fireButton');
let autoFire = false;

fireButton.addEventListener('mousedown', () => autoFire = true);
fireButton.addEventListener('mouseup', () => autoFire = false);
fireButton.addEventListener('touchstart', (e) => { e.preventDefault(); autoFire = true; });
fireButton.addEventListener('touchend', (e) => { e.preventDefault(); autoFire = false; });

setInterval(() => {
    if (autoFire && gameState.active) {
        playerShoot();
    }
}, 100);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.active) {
        e.preventDefault();
        playerShoot();
    }
});

// ==================== SHOOTING ====================
function playerShoot() {
    if (!player.canShoot || player.ammo <= 0 || player.reloading || !gameState.active) return;

    gameState.totalShots++;
    
    const speed = 12;
    const spread = 0.03;
    
    bullets.push({
        x: player.x + Math.cos(player.aimAngle) * 30,
        y: player.y + Math.sin(player.aimAngle) * 30,
        vx: Math.cos(player.aimAngle + (Math.random() - 0.5) * spread) * speed,
        vy: Math.sin(player.aimAngle + (Math.random() - 0.5) * spread) * speed,
        radius: 7,
        damage: 560,
        owner: 'player',
        color: '#10b981'
    });

    player.ammo--;
    player.canShoot = false;
    
    setTimeout(() => player.canShoot = true, player.shootDelay);

    if (player.ammo === 0) {
        player.reloading = true;
        setTimeout(() => {
            player.ammo = player.maxAmmo;
            player.reloading = false;
            updateAmmoDisplay();
        }, 1500);
    }

    updateAmmoDisplay();
}

function botShoot() {
    if (!bot.canShoot || bot.ammo <= 0 || bot.reloading || !gameState.active) return;

    const diff = difficulties[gameState.difficulty];
    
    let targetX = player.x;
    let targetY = player.y;
    
    if (diff.botPrediction > Math.random()) {
        const bulletSpeed = 12;
        const dist = Math.sqrt((player.x - bot.x) ** 2 + (player.y - bot.y) ** 2);
        const time = dist / bulletSpeed;
        targetX += player.vx * time * 8;
        targetY += player.vy * time * 8;
    }

    const inaccuracy = (1 - diff.botAccuracy) * 100;
    targetX += (Math.random() - 0.5) * inaccuracy;
    targetY += (Math.random() - 0.5) * inaccuracy;

    const angle = Math.atan2(targetY - bot.y, targetX - bot.x);
    const speed = 12;

    bullets.push({
        x: bot.x + Math.cos(angle) * 30,
        y: bot.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        damage: 560,
        owner: 'bot',
        color: '#ef4444'
    });

    bot.ammo--;
    bot.canShoot = false;
    bot.lastShot = Date.now();

    setTimeout(() => bot.canShoot = true, bot.shootDelay);

    if (bot.ammo === 0) {
        bot.reloading = true;
        setTimeout(() => {
            bot.ammo = bot.maxAmmo;
            bot.reloading = false;
        }, 1500);
    }
}

// ==================== BOT AI ====================
let botAIInterval;

function botAI() {
    clearInterval(botAIInterval);
    
    botAIInterval = setInterval(() => {
        if (!gameState.active) return;

        const diff = difficulties[gameState.difficulty];

        if (bot.canShoot && !bot.reloading) {
            botShoot();
        }

        let shouldDodge = false;
        bullets.forEach(bullet => {
            if (bullet.owner === 'player') {
                const dist = Math.sqrt((bullet.x - bot.x) ** 2 + (bullet.y - bot.y) ** 2);
                if (dist < 150 && Math.random() < diff.botDodgeChance) {
                    shouldDodge = true;
                    const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
                    const dodgeAngle = bulletAngle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
                    bot.vx = Math.cos(dodgeAngle) * bot.speed * 2;
                    bot.vy = Math.sin(dodgeAngle) * bot.speed * 2;
                }
            }
        });

        if (!shouldDodge && Math.random() < 0.15) {
            const angle = Math.random() * Math.PI * 2;
            bot.vx = Math.cos(angle) * bot.speed;
            bot.vy = Math.sin(angle) * bot.speed;
        }

        const distToPlayer = Math.sqrt((player.x - bot.x) ** 2 + (player.y - bot.y) ** 2);
        if (distToPlayer < 200 && Math.random() < 0.3) {
            const awayAngle = Math.atan2(bot.y - player.y, bot.x - player.x);
            bot.vx = Math.cos(awayAngle) * bot.speed;
            bot.vy = Math.sin(awayAngle) * bot.speed;
        }

    }, 200);
}

// ==================== UPDATE ====================
function update() {
    if (!gameState.active) return;

    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(player.radius + 20, Math.min(canvas.width - player.radius - 20, player.x));
    player.y = Math.max(player.radius + 20, Math.min(canvas.height - player.radius - 20, player.y));

    bot.x += bot.vx;
    bot.y += bot.vy;

    bot.x = Math.max(bot.radius + 20, Math.min(canvas.width - bot.radius - 20, bot.x));
    bot.y = Math.max(bot.radius + 20, Math.min(canvas.height / 2 - 50, bot.y));

    bot.vx *= 0.92;
    bot.vy *= 0.92;

    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.owner === 'player') {
            const dist = Math.sqrt((bullet.x - bot.x) ** 2 + (bullet.y - bot.y) ** 2);
            if (dist < bot.radius + bullet.radius) {
                bot.hp -= bullet.damage;
                gameState.totalHits++;
                gameState.totalDamage += bullet.damage;
                
                if (bot.hp <= 0) {
                    gameState.playerKills++;
                    updateUI();
                    respawn('bot');
                    if (gameState.playerKills >= gameState.targetKills) {
                        endGame('win');
                    }
                }
                return false;
            }
        }

        if (bullet.owner === 'bot') {
            const dist = Math.sqrt((bullet.x - player.x) ** 2 + (bullet.y - player.y) ** 2);
            if (dist < player.radius + bullet.radius) {
                player.hp -= bullet.damage;
                
                if (player.hp <= 0) {
                    gameState.botKills++;
                    updateUI();
                    respawn('player');
                    if (gameState.botKills >= gameState.targetKills) {
                        endGame('lose');
                    }
                }
                return false;
            }
        }

        return bullet.x > -50 && bullet.x < canvas.width + 50 && 
               bullet.y > -50 && bullet.y < canvas.height + 50;
    });
}

// ==================== RESPAWN ====================
function respawn(who) {
    if (who === 'player') {
        player.hp = player.maxHp;
        player.x = canvas.width / 2;
        player.y = canvas.height - 150;
        player.ammo = player.maxAmmo;
        player.reloading = false;
        player.vx = 0;
        player.vy = 0;
        updateAmmoDisplay();
    } else {
        bot.hp = bot.maxHp;
        bot.x = canvas.width / 2;
        bot.y = 150;
        bot.ammo = bot.maxAmmo;
        bot.reloading = false;
        bot.vx = 0;
        bot.vy = 0;
    }
}

// ==================== DRAW ====================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    drawCharacter(bot, 'Bot1');
    drawCharacter(player, 'homo');

    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    drawAimLine(player, '#10b981');
    drawAimLine(bot, '#ef4444');
}

function drawCharacter(char, name) {
    ctx.fillStyle = char.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = char.color;
    ctx.beginPath();
    ctx.arc(char.x, char.y, char.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    const barWidth = 60;
    const barHeight = 8;
    const barX = char.x - barWidth / 2;
    const barY = char.y - char.radius - 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = Math.max(0, char.hp / char.maxHp);
    ctx.fillStyle = hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, char.x, barY - 5);
    ctx.fillText(Math.max(0, char.hp), char.x, barY + barHeight + 15);
}

function drawAimLine(char, color) {
    const aimAngle = char === player ? player.aimAngle : Math.atan2(player.y - bot.y, player.x - bot.x);
    
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(char.x, char.y);
    ctx.lineTo(
        char.x + Math.cos(aimAngle) * char.aimDistance,
        char.y + Math.sin(aimAngle) * char.aimDistance
    );
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
        char.x + Math.cos(aimAngle) * char.aimDistance,
        char.y + Math.sin(aimAngle) * char.aimDistance,
        5, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
}

// ==================== UI ====================
function updateUI() {
    document.getElementById('playerScore').textContent = `${gameState.playerKills}/${gameState.targetKills}`;
    document.getElementById('botScore').textContent = `${gameState.botKills}/${gameState.targetKills}`;
}

function updateAmmoDisplay() {
    const ammoSlots = document.querySelectorAll('.ammo-slot');
    ammoSlots.forEach((slot, i) => {
        if (i < player.ammo) {
            slot.classList.add('filled');
            slot.classList.remove('reloading');
        } else {
            slot.classList.remove('filled');
            if (player.reloading) {
                slot.classList.add('reloading');
            }
        }
    });
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (!gameState.active) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ==================== END GAME ====================
function endGame(result) {
    gameState.active = false;
    clearInterval(timerInterval);
    clearInterval(botAIInterval);

    const accuracy = gameState.totalShots > 0 ? 
        Math.round((gameState.totalHits / gameState.totalShots) * 100) : 0;

    document.getElementById('finalScore').textContent = 
        `${gameState.playerKills} - ${gameState.botKills}`;
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('totalDamage').textContent = gameState.totalDamage.toLocaleString();

    const resultTitle = document.getElementById('resultTitle');
    if (result === 'win') {
        resultTitle.textContent = 'KAZANDIN! 🎉';
        resultTitle.className = 'result-title win';
    } else if (result === 'lose') {
        resultTitle.textContent = 'KAYBETTİN 😢';
        resultTitle.className = 'result-title lose';
    } else {
        resultTitle.textContent = gameState.playerKills > gameState.botKills ? 'KAZANDIN! 🎉' : 'KAYBETTİN 😢';
        resultTitle.className = gameState.playerKills > gameState.botKills ? 'result-title win' : 'result-title lose';
    }

    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameoverScreen').classList.add('active');
}

// ==================== INITIALIZE ====================
document.getElementById('menuScreen').classList.add('active');
