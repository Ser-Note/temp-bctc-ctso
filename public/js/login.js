const allElements = document.querySelectorAll('*');

let curTheme = getTheme();

// Add theme class to all elements
allElements.forEach(el => {
    el.classList.add(curTheme);
});

// #region Flower Theme Features
// Add flower petals falling effect
function setFlowerTheme() {
    createFallingEffect('🌸', 30, 80, 80);
}
// #endregion


// #region Winter Theme Features
// Snowflake animation function
function createFallingEffect(content, size = 18, amount = 60, speedMult = 10) {
    let snowContainer = document.getElementById('winterSnowContainer');
    if (!snowContainer) {
        snowContainer = document.createElement('div');
        snowContainer.id = 'winterSnowContainer';
        document.body.appendChild(snowContainer);
    }
    snowContainer.style.position = 'fixed';
    snowContainer.style.top = '0';
    snowContainer.style.left = '0';
    snowContainer.style.width = '100vw';
    snowContainer.style.height = '100vh';
    snowContainer.style.pointerEvents = 'none';
    snowContainer.style.zIndex = '1200';
    snowContainer.style.display = 'block';
    // Create a fixed number of snowflakes that animate via CSS for continuous effect
    for (let i = 0; i < amount; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = content;
        // random horizontal start
        snowflake.style.left = (Math.random() * 100) + '%';
        // random size
        snowflake.style.fontSize = (Math.random() * size + 8) + 'px';
        // opacity
        snowflake.style.opacity = (Math.random() * 0.6 + 0.3).toString();
        // random animation duration and delay (negative delay scatters positions immediately)
        const duration = (6 + Math.random() * speedMult).toFixed(2) + 's';
        const delay = (-Math.random() * 12).toFixed(2) + 's';
        snowflake.style.animationDuration = duration;
        snowflake.style.animationDelay = delay;
        snowContainer.appendChild(snowflake);
    }
}

function setWinterTheme() {
    // Ensure winter background layer exists
    let bg = document.getElementById('winterBackground');
    if (!bg) {
        bg = document.createElement('div');
        bg.id = 'winterBackground';
        document.body.appendChild(bg);
    }

    // Add snowflake animation
    createFallingEffect('❄');

    // Show polar bear mascot
    document.getElementById('winterBear').style.display = 'block';

    // Animate polar bear hand waving
    const winterBear = document.getElementById('winterBear');
    winterBear.addEventListener('load', () => {
        const svgDoc = winterBear.contentDocument;
        const hand = svgDoc.getElementById('hand');
        if (hand) {
            let angle = 0;
            setInterval(() => {
                angle += 0.15; // slightly faster
                const wave = Math.sin(angle) * 20; // larger movement
                hand.style.transformOrigin = 'center';
                hand.style.transform = `translateY(${wave}px) rotate(${wave * 0.5}deg)`;
            }, 50);
        }
    });
}
// #endregion




function getTheme() {
    let curDate = new Date(
        new Date().toLocaleString('en-US', { timeZone: "America/New_York" })
    );

    const tempdate = 2;

    const month = curDate.getMonth();
    let theme;
    switch (tempdate) {
        case 0:
        case 1:
        case 10:
        case 11:
            theme = "Winter";
            setWinterTheme();
            break;

        case 2:
        case 3:
        case 4:
            theme = "Flowers";
            setFlowerTheme();
            break;

        case 5:
        case 7:
            theme = "Summer";
            break;

        case 6:
            theme = "Fourth_Of_July";
            break;

        case 8:
        case 9:
            theme = "Fall";
            break;
    }

    return theme;
}

