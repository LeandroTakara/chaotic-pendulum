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
        this.lineWidth = 3

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
        this.ctx.lineWidth = this.lineWidth
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
    #x
    #y
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
        this.#x = x
        this.#y = y

        this.#maxTrails = 10
        this.trails = []

        this.firstPendulum = null
        this.lastPendulum = null
    }

    get x() {
        return this.#x
    }

    set x(value) {
        this.#x = value

        if (this.firstPendulum) this.firstPendulum.startX = value
    }

    get y() {
        return this.#y
    }

    set y(value) {
        this.#y = value

        if (this.firstPendulum) this.firstPendulum.startY = value
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
 * @param {string} attribute 
 * @param {any} initialValue 
 * @param {(value: number) => void} inputCallback 
 * @param {() => number} [reflectCallback = null]
 */
function createHTMLPendulumAttributeNumber(attribute, initialValue, inputCallback, reflectCallback = null) {
    const label = document.createElement('label')
    label.className = 'pendulum-number-attribute'

    const span = document.createElement('span')
    span.className = 'pendulum-input-info'
    span.innerText = attribute + ':'

    const input = document.createElement('input')
    input.className = 'pendulum-input-number'
    input.type = 'number'
    input.value = initialValue
    input.addEventListener('input', e => inputCallback(parseFloat(e.target.value || 0)))

    if (reflectCallback) updateInputs.push({ input, update: reflectCallback })

    label.append(span, input)

    return label
}

/**
 * @param {string} iconName 
 * @param {any} initialValue 
 * @param {(value: number) => void} inputCallback 
 * @returns 
 */
function createHTMLPendulumAttributeColor(iconName, initialValue, inputCallback) {
    const label = document.createElement('label')
    label.className = 'pendulum-color-attribute'


    const iconWrapper = document.createElement('div')
    iconWrapper.className = 'icon-wrapper'

    const icon = document.createElement('div')
    icon.className = iconName

    iconWrapper.appendChild(icon)


    const inputWrapper = document.createElement('div')
    inputWrapper.className = 'pendulum-input-color-wrapper'

    const input = document.createElement('input')
    input.className = 'pendulum-input-color'
    input.type = 'color'
    input.value = initialValue
    input.addEventListener('input', e => inputCallback(e.target.value))

    inputWrapper.appendChild(input)


    label.append(iconWrapper, inputWrapper)

    return label
}

/**
 * @param {Pendulum} pendulum 
 */
function createHTMLPendulum(pendulum) {
    const divPendulum = document.createElement('div')
    divPendulum.className = 'pendulum'

    const divPendulumAttributesWrapper = document.createElement('div')
    divPendulumAttributesWrapper.className = 'pendulum-attributes-wrapper'

    const divPendulumAttributes = document.createElement('div')
    divPendulumAttributes.className = 'pendulum-attributes'

    const divPendulumNumberInputs = document.createElement('div')
    divPendulumNumberInputs.className = 'pendulum-number-inputs'

    
    const labelSpeed = createHTMLPendulumAttributeNumber('Speed', pendulum.angularSpeed,
        function(value) {
            pendulum.angularSpeed = value
        }
    )

    const labelLength = createHTMLPendulumAttributeNumber('Length', pendulum.length,
        function(value) {
            pendulum.length = value
            draw()
        }
    )

    const labelDegrees = createHTMLPendulumAttributeNumber('Degrees', toDegrees(pendulum.radians),
        function(value) {
            pendulum.radians = toRadians(value)
            draw()
        },
        () => toDegrees(pendulum.radians)
    )

    divPendulumNumberInputs.append(labelSpeed, labelLength, labelDegrees)

    const colorsWrapper = document.createElement('div')
    colorsWrapper.className = 'colors-wrapper'

    const labelBallColor = createHTMLPendulumAttributeColor('ball-icon', pendulum.ballColor, function(value) {
        pendulum.ballColor = value
        draw()
    })

    const labelLineColor = createHTMLPendulumAttributeColor('line-icon', pendulum.lineColor, function(value) {
        pendulum.lineColor = value
        draw()
    })

    const btnRemovePendulum = document.createElement('button')
    btnRemovePendulum.type = 'button'
    btnRemovePendulum.className = 'btn-close-pendulum'
    btnRemovePendulum.addEventListener('click', function() {
        chaoticPendulum.removePendulum(pendulum)
        divPendulum.remove()
        draw()
    })

    const iconX = document.createElement('div')
    iconX.className = 'icon-x'

    btnRemovePendulum.appendChild(iconX)

    const btnMinimize = document.createElement('button')
    btnMinimize.type = 'button'
    btnMinimize.className = 'btn-minimize-pendulum'
    btnMinimize.addEventListener('click', function() {
        divPendulum.classList.toggle('minimized')
    })

    const iconChevron = document.createElement('div')
    iconChevron.className = 'icon-chevron'

    btnMinimize.appendChild(iconChevron)

    colorsWrapper.append(labelBallColor, labelLineColor)

    divPendulumAttributes.append(divPendulumNumberInputs, colorsWrapper)

    divPendulumAttributesWrapper.append(divPendulumAttributes)

    divPendulum.append(divPendulumAttributesWrapper, btnRemovePendulum, btnMinimize)

    return divPendulum
}

function createPendulum() {
    const pendulum = chaoticPendulum.createPendulum(DEFAULT_PENDULUM_LENGTH, DEFAULT_PENDULUM_SPEED, DEFAULT_PENDULUM_RADIANS)

    const HTMLPendulum = createHTMLPendulum(pendulum)

    divPendulumParts.appendChild(HTMLPendulum)
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function draw() {
    clearCanvas()
    
    ctx.setTransform(scale, 0, 0, scale, canvas.width / 2 + offsetX, canvas.height / 2 + offsetY)
    chaoticPendulum.draw()
    resetContext()
}

function update() {
    chaoticPendulum.update()
    updateInputs.forEach(input => input.input.value = input.update())
}

function startAnimation() {
    animationFrame = requestAnimationFrame(updateAnimation)

    btnPlay.classList.add('hidden')
    btnPause.classList.remove('hidden')
}

function updateAnimation() {
    animationFrame = requestAnimationFrame(updateAnimation)

    update()
    draw()
}

function stopAnimation() {
    cancelAnimationFrame(animationFrame)

    btnPause.classList.add('hidden')
    btnPlay.classList.remove('hidden')
}

function toRadians(degrees) {
    return degrees * Math.PI / 180
}

function toDegrees(radians) {
    return radians * 180 / Math.PI
}

function resizeCanvas() {
    canvas.width = canvas.getBoundingClientRect().width
    canvas.height = canvas.getBoundingClientRect().height
}

function setUpCanvas() {
    resizeCanvas()
    createPendulum()
    draw()
}

function resetContext() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function translateCanvas(x, y) {
    offsetX += x
    offsetY += y
}

function zoomCanvas(zoom) {
    scale *= zoom
}

function handleStartMove(x, y) {
    prevX = x
    prevY = y
    isHolding = true
}

function handleMove(x, y) {
    const offsetX = x - prevX
    const offsetY = y - prevY
    
    prevX = x
    prevY = y
    
    translateCanvas(offsetX, offsetY)
    draw()
}

function handleStopMove() {
    prevX = 0
    prevY = 0
    isHolding = false
}

const FULL_RADIANS = 2 * Math.PI

const ZOOM_IN = 1.2
const ZOOM_OUT = 1 / ZOOM_IN

// pendulum constants
const DEFAULT_PENDULUM_SPEED = 1
const DEFAULT_PENDULUM_LENGTH = 50
const DEFAULT_PENDULUM_RADIANS = Math.PI / 2

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('chaotic-pendulum-canvas')
const ctx = canvas.getContext('2d')

const observer = new ResizeObserver(() => {
    resizeCanvas()
    draw()
})
observer.observe(canvas)

const divPendulumInfo = document.querySelector('.pendulum-info')
const divPendulumParts = document.querySelector('.pendulum-parts')

const chaoticPendulum = new ChaoticPendulum(ctx, 0, 0)
const updateInputs = []

let offsetX = 0
let offsetY = 0
let scale = 1

let prevX = 0
let prevY = 0
let isHolding = false

let animationFrame = null

const btnClose = document.querySelector('.btn-close')
btnClose.addEventListener('click', function() {
    divPendulumInfo.classList.toggle('closed')
})

const btnAddPart = document.querySelector('.btn-add')
btnAddPart.addEventListener('click', function() {
    createPendulum()
    draw()
})

const btnPlay = document.querySelector('.btn-play')
btnPlay.addEventListener('click', startAnimation)

const btnPause = document.querySelector('.btn-pause')
btnPause.addEventListener('click', stopAnimation)

const btnZoomIn = document.querySelector('.btn-zoom-in')
btnZoomIn.addEventListener('click', function() {
    zoomCanvas(ZOOM_IN)
    draw()
})

const btnZoomOut = document.querySelector('.btn-zoom-out')
btnZoomOut.addEventListener('click', function() {
    zoomCanvas(ZOOM_OUT)
    draw()
})

addEventListener('resize', resizeCanvas)

canvas.addEventListener('touchstart', function(event) {
    const touch = event.touches[0]
    handleStartMove(touch.clientX, touch.clientY)
})

canvas.addEventListener('touchmove', function(event) {
    const touch = event.touches[0]
    handleMove(touch.clientX, touch.clientY)
})

canvas.addEventListener('touchend', handleStopMove)


canvas.addEventListener('mousedown',  function(event) {
    handleStartMove(event.x, event.y)
})
canvas.addEventListener('mousemove',  function(event) {
    if (!isHolding) return

    handleMove(event.x, event.y)
})
document.addEventListener('mouseup', handleStopMove)

canvas.addEventListener('wheel', function(e) {
    const zoom = e.deltaY < 0 ? ZOOM_IN : ZOOM_OUT

    zoomCanvas(zoom)
    draw()
})

setUpCanvas()
