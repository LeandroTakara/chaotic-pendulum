/**
 * It resembles a pendulum in the sense that it moves in a circular motion and it might have another pendulum at its end.
 * 
 * It can be connected to another pendulum and any changes made to startX, startY, length, radians or next properties are updated in the connections until the last pendulum
 */
class Pendulum {
    // auto update properties, when any of them is changed the next pendulums are also changed
    #startX
    #startY
    #length
    #radians
    /** @type {Pendulum} */
    #next

    /**
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} startX start x coordinate
     * @param {number} startY start y coordinate
     * @param {number} length pendulum length
     * @param {number} angularSpeed pendulum angular speed
     * @param {number} [radians = 0] start radians
     */
    constructor(ctx, startX, startY, length, angularSpeed, radians = 0) {
        this.ctx = ctx
        this.#startX = startX
        this.#startY = startY
        this.#length = length
        this.angularSpeed = angularSpeed
        this.#radians = radians

        this.lineColor = '#ffffff'
        this.lineThickness = 3

        this.ballColor = '#ffffff'
        this.ballRadius = 3

        this.#next = null
    }

    get startX() {
        return this.#startX
    }

    set startX(value) {
        this.#startX = value

        this.#propagateChanges()
    }

    get startY() {
        return this.#startY
    }

    set startY(value) {
        this.#startY = value

        this.#propagateChanges()
    }

    get endX() {
        return this.startX + Math.cos(this.radians) * this.length
    }

    get endY() {
        return this.startY + Math.sin(this.radians) * this.length
    }

    get length() {
        return this.#length
    }

    set length(value) {
        this.#length = value

        this.#propagateChanges()
    }

    get radians() {
        return this.#radians
    }

    set radians(value) {
        this.#radians = value

        this.#propagateChanges()
    }

    get next() {
        return this.#next
    }

    set next(value) {
        this.#next = value

        this.#propagateChanges()
    }

    /**
     * Sets the new start position of the pendulum
     * @param {number} startX new x coordinate
     * @param {number} startY new y coordinate
     */
    setPosition(startX, startY) {
        this.#startX = startX
        this.#startY = startY

        this.#propagateChanges()
    }

    /**
     * It propagates the changes made to the startX, startY, length, radians or next properties to the next element and so on until the last one
     */
    #propagateChanges() {
        this.next?.setPosition(this.endX, this.endY)
    }

    /**
     * Draws the pendulum
     */
    draw() {
        // draw a line connecting the start position to the end
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.strokeStyle = this.lineColor
        this.ctx.lineWidth = this.lineThickness
        this.ctx.moveTo(this.startX, this.startY)
        this.ctx.lineTo(this.endX, this.endY)
        this.ctx.stroke()
        this.ctx.closePath()
        this.ctx.restore()

        // draw the ball on the end position
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.fillStyle = this.ballColor
        this.ctx.arc(this.endX, this.endY, this.ballRadius, 0, FULL_RADIANS)
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }

    /**
     * Updates the position of the pendulum and subsequent pendulums
     */
    update() {
        // angularSpeed is multiplied by a tenth to divide 1 radian into 100 parts (not necessary)
        this.radians += this.angularSpeed * 0.01

        // updates the next element if it exists
        if (this.next) {
            // updates the next immediate element position without propagating the changes through the chain to avoid unnecessary changes,
            // because the elements ahead will have a definitely change once their previous element is updated
            this.next.#startX = this.endX
            this.next.#startY = this.endY
            
            this.next.update()
        }
    }
}

/**
 * It controls the Pendulum and Trail class
 */
class ChaoticPendulum {
    #maxTrails

    // acts like a queue
    /** @type {Trail[]} */
    trails

    /** @type {Pendulum} */
    firstPendulum

    // the reference to the last pendulum is used to create the trail
    /** @type {Pendulum} */
    lastPendulum

    /**
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     */
    constructor(ctx, x, y) {
        this.ctx = ctx
        this.x = x
        this.y = y

        this.#maxTrails = 10
        this.trails = []

        this.firstPendulum = null
        this.lastPendulum = null
    }

    get maxTrail() {
        return this.#maxTrails
    }

    set maxTrail(value) {
        this.#maxTrails = value

        // removes the excess trail
        this.trails.splice(value)
    }

    /**
     * Creates a pendulum, appends it to the pendulum chain and returns it
     * @param {number} length pendulum length
     * @param {number} angularSpeed pendulum angular speed
     * @param {number} radians start radians
     */
    createPendulum(length, angularSpeed, radians) {
        let pendulum = null
        
        if (this.firstPendulum === null) {
            pendulum = new Pendulum(this.ctx, this.x, this.y, length, angularSpeed, radians)
            this.firstPendulum = pendulum
            this.lastPendulum = pendulum
        } else {
            pendulum = new Pendulum(this.ctx, this.lastPendulum.endX, this.lastPendulum.endY, length, angularSpeed, radians)
            this.lastPendulum.next = pendulum
            this.lastPendulum = this.lastPendulum.next
        }
        
        return pendulum
    }

    /**
     * Removes a pendulum from the pendulum chain
     * @param {Pendulum} pendulum pendulum to be removed
     */
    removePendulum(pendulum) {
        if (pendulum === this.firstPendulum) {
            this.firstPendulum = this.firstPendulum.next

            this.firstPendulum?.setPosition(pendulum.startX, pendulum.startY)
        } else {
            let runner = this.firstPendulum

            while (runner.next !== pendulum) {
                runner = runner.next
            }

            runner.next = pendulum.next

            if (pendulum === this.lastPendulum) {
                this.lastPendulum = runner
            }
        }
    }

    /**
     * Draws the entire pendulum chain and the trails
     */
    draw() {
        let runner = this.firstPendulum

        while (runner) {
            runner.draw()
            runner = runner.next
        }

        this.trails.forEach(trail => trail.draw())
    }

    /**
     * Updates the entire pendulum chain and the trails
     */
    update() {
        // updates the pendulum chain
        this.firstPendulum?.update()

        if (this.firstPendulum) {
            // updates the trails
            this.trails.forEach((trail, i) => trail.setOpacityValue(i, this.maxTrail))

            // creates a new trail
            this.#createTrail(this.lastPendulum.endX, this.lastPendulum.endY, this.lastPendulum.ballRadius)
        }
    }

    /**
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     * @param {number} radius radius
     */
    #createTrail(x, y, radius) {
        // appends the trail to the start
        if (this.trails.length < this.maxTrail) {
            this.trails.unshift(new Trail(this.ctx, x, y, radius))
        }

        // removes the last trail
        if (this.trails.length === this.maxTrail) {
            this.trails.pop()
        }
    }
}

class Trail {
    /**
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     * @param {number} radius radius
     */
    constructor(ctx, x, y, radius) {
        this.ctx = ctx
        this.x = x
        this.y = y
        this.radius = radius

        this.color = '#ffffff'
        this.opacity = 1
    }

    /**
     * Draws the trail
     */
    draw() {
        this.ctx.save()
        this.ctx.globalAlpha = this.opacity
        this.ctx.fillStyle = this.color
        this.ctx.beginPath()
        this.ctx.arc(this.x, this.y, this.radius, 0, FULL_RADIANS)
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }

    /**
     * @param {number} t time elapsed since it was created
     * @param {number} n max number of trails
     */
    setOpacityValue(t, n) {
        this.opacity = 1 - t / n
    }
}

/**
 * @param {Pendulum} pendulum 
 */
function createHTMLPendulum(pendulum) {
    const divContainer = document.createElement('div')
    divContainer.className = 'pendulum'

    // create the pendulum attributes
    const wrapperInputColor = document.createElement('div')
    wrapperInputColor.className = 'input-pendulum-color-wrapper'

    const inputColor = document.createElement('input')
    inputColor.type = 'color'
    inputColor.value = pendulum.lineColor
    inputColor.className = 'input-pendulum-color'
    inputColor.addEventListener('input', function() {
        pendulum.lineColor = inputColor.value
        draw()
    })

    wrapperInputColor.appendChild(inputColor)

    const elementSpeed = createHTMLPendulumAttribute('Speed', pendulum.angularSpeed)
    elementSpeed.input.addEventListener('input', function() {
        pendulum.angularSpeed = parseFloat(elementSpeed.input.value || 0)
    })

    const elementLength = createHTMLPendulumAttribute('Length', pendulum.length)
    elementLength.input.addEventListener('input', function() {
        pendulum.length = parseFloat(elementLength.input.value) || 0
        draw()
    })

    const elementRadians = createHTMLPendulumAttribute('Degrees', toDegrees(pendulum.radians))
    elementRadians.input.addEventListener('input', function() {
        pendulum.radians = toRadians(parseFloat(elementRadians.input.value) || 0)
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

/**
 * @param {string} name label text
 * @param {number} value initial value
 * @returns 
 */
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
    const pendulum = chaoticPendulum.createPendulum(DEFAULT_PENDULUM_LENGTH, DEFAULT_PENDULUM_SPEED, DEFAULT_PENDULUM_RADIANS)

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

const inputMaxTrail = document.getElementById('inputMaxTrail')
inputMaxTrail.value = chaoticPendulum.maxTrail
inputMaxTrail.addEventListener('input', function() {
    chaoticPendulum.maxTrail = parseInt(inputMaxTrail.value) || 0
    draw()
})

const btnPlay = document.getElementById('btnPlay')
btnPlay.addEventListener('click', startAnimation)

const btnStop = document.getElementById('btnStop')
btnStop.addEventListener('click', stopAnimation)

createPendulum()
draw()
