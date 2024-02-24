class Pendulum {
    constructor(ctx, x, y, speed, length, radians) {
        this.ctx = ctx
        this.x = x
        this.y = y
        this.speed = speed
        this.length = length
        this.radians = radians
        this.color = '#ffffff'
    }

    get endX() {
        return this.x + Math.cos(this.radians) * this.length
    }
    
    get endY() {
        return this.y + Math.sin(this.radians) * this.length
    }

    draw() {
        this.ctx.save()

        this.ctx.beginPath()
        this.ctx.strokeStyle = this.color
        this.ctx.lineWidth = 3
        this.ctx.moveTo(this.x, this.y)
        this.ctx.lineTo(this.endX, this.endY)
        this.ctx.stroke()
        this.ctx.closePath()

        this.ctx.beginPath()
        this.ctx.fillStyle = 'white'
        this.ctx.arc(this.endX, this.endY, 3, 0, FULL_RADIANS)
        this.ctx.fill()
        this.ctx.closePath()

        this.ctx.restore()
    }

    update() {
        this.radians += this.speed * 0.01
    }
}

class ChaoticPendulum {
    #maxDots

    constructor(ctx, x, y) {
        this.ctx = ctx
        this.x = x
        this.y = y

        this.pendulums = []

        this.#maxDots = 10
        this.dots = []
    }

    get maxDots() {
        return this.#maxDots
    }

    set maxDots(value) {
        this.#maxDots = value
        this.dots = this.dots.slice(0, value)
    }

    get opacityDecreaseRate() {
        return 1 / this.maxDots
    }

    get endX() {
        return this.pendulums[this.pendulums.length - 1]?.endX || this.x
    }
    
    get endY() {
        return this.pendulums[this.pendulums.length - 1]?.endY || this.y
    }

    createPendulum(speed, length, radians) {
        const pendulum = new Pendulum(this.ctx, this.endX, this.endY, speed, length, radians)
        this.pendulums.push(pendulum)
        return pendulum
    }

    draw() {
        this.pendulums.forEach(pendulum => pendulum.draw())
        this.dots.forEach(dot => dot.draw())
    }

    update() {
        let curX = this.x
        let curY = this.y

        this.pendulums.forEach(pendulum => {
            // update the pendulum position
            pendulum.x = curX
            pendulum.y = curY

            pendulum.update()

            // get the current pendulum position to set to the next one
            curX = pendulum.endX
            curY = pendulum.endY
        })

        this.dots.forEach((dot, i) => dot.opacity = 1 - this.opacityDecreaseRate * i)

        this.createGhostDot(curX, curY)
    }

    createGhostDot(x, y) {
        this.dots.unshift(new Dot(this.ctx, x, y))

        if (this.dots.length > this.maxDots) {
            this.dots.pop()
        }
    }

    removePendulum(pendulum) {
        const pendulumIndex = this.pendulums.indexOf(pendulum)

        if (this.pendulums[pendulumIndex + 1]) {
            this.pendulums[pendulumIndex + 1].x = pendulum.x
            this.pendulums[pendulumIndex + 1].y = pendulum.y
        }

        for (let i = pendulumIndex + 2; i < this.pendulums.length; i++) {
            this.pendulums[i].x = this.pendulums[i - 1].endX
            this.pendulums[i].y = this.pendulums[i - 1].endY
        }

        this.pendulums.splice(pendulumIndex, 1)
    }

    changeLength(pendulum, length) {
        const pendulumIndex = this.pendulums.indexOf(pendulum)
        pendulum.length = length

        for (let i = pendulumIndex + 1; i < this.pendulums.length; i++) {
            this.pendulums[i].x = this.pendulums[i - 1].endX
            this.pendulums[i].y = this.pendulums[i - 1].endY
        }
    }

    changeRadians(pendulum, radians) {
        const pendulumIndex = this.pendulums.indexOf(pendulum)
        pendulum.radians = radians

        for (let i = pendulumIndex + 1; i < this.pendulums.length; i++) {
            this.pendulums[i].x = this.pendulums[i - 1].endX
            this.pendulums[i].y = this.pendulums[i - 1].endY
        }
    }
}

class Dot {
    constructor(ctx, x, y) {
        this.ctx = ctx
        this.x = x
        this.y = y
        this.opacity = 1
    }

    draw() {
        this .ctx.save()
        this.ctx.globalAlpha = this.opacity
        this.ctx.fillStyle = 'white'
        this.ctx.beginPath()
        this.ctx.arc(this.x, this.y, 3, 0, FULL_RADIANS)
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }
}

/**
 * @param {number} speed 
 * @param {number} length 
 */
function createHTMLPendulum(pendulum) {
    const divContainer = document.createElement('div')
    divContainer.className = 'pendulum'

    // create the pendulum attributes

    const wrapperInputColor = document.createElement('div')
    wrapperInputColor.className = 'input-pendulum-color-wrapper'

    const inputColor = document.createElement('input')
    inputColor.type = 'color'
    inputColor.value = pendulum.color
    inputColor.className = 'input-pendulum-color'
    inputColor.addEventListener('input', function() {
        pendulum.color = inputColor.value
        draw()
    })

    wrapperInputColor.appendChild(inputColor)

    const elementSpeed = createHTMLPendulumAttribute('Speed', pendulum.speed)
    elementSpeed.input.addEventListener('input', function() {
        pendulum.speed = parseFloat(elementSpeed.input.value || 0)
    })

    const elementLength = createHTMLPendulumAttribute('Length', pendulum.length)
    elementLength.input.addEventListener('input', function() {
        chaoticPendulum.changeLength(pendulum, parseFloat(elementLength.input.value) || 0)
        draw()
    })

    const elementRadians = createHTMLPendulumAttribute('Degrees', toDegrees(pendulum.radians))
    elementRadians.input.addEventListener('input', function() {
        chaoticPendulum.changeRadians(pendulum, toRadians(parseFloat(elementRadians.input.value) || 0))
        draw()
    })

    updateInputs.push({
        input: elementRadians.input,
        update: () => toDegrees(pendulum.radians)
    })

    const btnRemove = document.createElement('button')
    btnRemove.type = 'button'
    btnRemove.className = 'btnRemovePendulum'
    btnRemove.addEventListener('click', function() {
        chaoticPendulum.removePendulum(pendulum)
        divContainer.remove()
        draw()
    })

    // append the attributes to the container
    divContainer.append(wrapperInputColor, elementSpeed.label, elementLength.label, elementRadians.label, btnRemove)

    return divContainer
}

function createHTMLPendulumAttribute(name, value) {
    const label = document.createElement('label')
    label.innerText = name + ': '

    const input = document.createElement('input')
    input.type = 'number'
    input.className = 'input-pendulum-attribute'
    input.value = value

    label.appendChild(input)

    return { label, input }
}

function createPendulum() {
    const pendulum = chaoticPendulum.createPendulum(DEFAULT_PENDULUM_SPEED, DEFAULT_PENDULUM_LENGTH, DEFAULT_PENDULUM_RADIANS)

    const HTMLPendulum = createHTMLPendulum(pendulum)

    divPendulumParts.appendChild(HTMLPendulum)
}

function paintBackground() {
    ctx.save()
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
}

function draw() {
    paintBackground()

    chaoticPendulum.draw()
}

function update() {
    chaoticPendulum.update()
    updateInputs.forEach(input => input.input.value = input.update())
}

function startAnimation() {
    animationFrame = requestAnimationFrame(updateAnimation)
}

function updateAnimation() {
    animationFrame = requestAnimationFrame(updateAnimation)

    update()
    draw()
}

function stopAnimation() {
    cancelAnimationFrame(animationFrame)
}

function toRadians(degrees) {
    return degrees * Math.PI / 180
}

function toDegrees(radians) {
    return radians * 180 / Math.PI
}

const FULL_RADIANS = 2 * Math.PI

// pendulum constants
const DEFAULT_PENDULUM_SPEED = 1
const DEFAULT_PENDULUM_LENGTH = 50
const DEFAULT_PENDULUM_RADIANS = Math.PI / 2

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('chaotic-pendulum-canvas')
const ctx = canvas.getContext('2d')

const CENTER_X = canvas.width / 2
const CENTER_Y = canvas.height / 2

const chaoticPendulum = new ChaoticPendulum(ctx, CENTER_X, CENTER_Y)
const updateInputs = []

let animationFrame = null

const divPendulumParts = document.querySelector('.pendulum-parts')

const btnAddPart = document.getElementById('btnAddPart')
btnAddPart.addEventListener('click', function() {
    createPendulum()
    draw()
})

const inputMaxDots = document.getElementById('inputMaxDots')
inputMaxDots.value = chaoticPendulum.maxDots
inputMaxDots.addEventListener('input', function() {
    chaoticPendulum.maxDots = parseInt(inputMaxDots.value) || 0
})

const btnPlay = document.getElementById('btnPlay')
btnPlay.addEventListener('click', startAnimation)

const btnStop = document.getElementById('btnStop')
btnStop.addEventListener('click', stopAnimation)

createPendulum()
draw()
