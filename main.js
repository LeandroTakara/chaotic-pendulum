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
     * Create a pendulum
     * @param {CanvasRenderingContext2D} ctx canvas 2d context
     * @param {number} startX start x coordinate
     * @param {number} startY start y coordinate
     * @param {number} length pendulum length
     * @param {number} angularSpeed pendulum angular speed
     * @param {number} [radians = 0] start radians (default 0)
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
        this.drawLine()
        this.drawBall()
    }

    /**
     * Draws the line
     */
    drawLine() {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.strokeStyle = this.lineColor
        this.ctx.lineWidth = this.lineWidth
        this.ctx.moveTo(this.startX, this.startY)
        this.ctx.lineTo(this.endX, this.endY)
        this.ctx.stroke()
        this.ctx.closePath()
        this.ctx.restore()
    }

    /**
     * Draws the ball
     */
    drawBall() {
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
     * Creates a chaotic pendulum
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

    get maxTrails() {
        return this.#maxTrails
    }

    set maxTrails(value) {
        this.#maxTrails = value

        this.resetTrail()
    }
    
    /**
     * Resets the trail
     */
    resetTrail() {
        this.trails.splice(0)
    }

    /**
     * Creates a pendulum, appends it to the pendulum chain and returns it
     * @param {number} length pendulum length
     * @param {number} angularSpeed pendulum angular speed
     * @param {number} radians start radians
     * @returns {Pendulum} pendulum
     */
    createPendulum(length, angularSpeed, radians) {
        let pendulum = null
        
        if (this.firstPendulum === null) { // root pendulum does not exists
            pendulum = new Pendulum(this.ctx, this.x, this.y, length, angularSpeed, radians)

            // assigns the first and last reference of the pendulum
            this.firstPendulum = pendulum
            this.lastPendulum = pendulum
        } else { // root pendulum exists
            pendulum = new Pendulum(this.ctx, this.lastPendulum.endX, this.lastPendulum.endY, length, angularSpeed, radians)

            // changes the reference to the last pendulum, because a new one was created
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
        if (pendulum === this.firstPendulum) { // the root is being removed
            this.firstPendulum = this.firstPendulum.next

            this.firstPendulum?.setPosition(pendulum.startX, pendulum.startY)
        } else { // some pendulum is being removed
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
        this.drawTrails()
        this.drawPendulum()
    }

    /**
     * Draws the pendulum
     */
    drawPendulum() {
        // draws the lines
        let runner = this.firstPendulum

        while (runner) {
            runner.drawLine()
            runner = runner.next
        }

        // draws the balls
        runner = this.firstPendulum

        while (runner) {
            runner.drawBall()
            runner = runner.next
        }
    }

    /**
     * Draws the trails
     */
    drawTrails() {
        this.trails.forEach(trail => trail.draw())
    }

    /**
     * Updates the entire pendulum chain and the trails
     */
    update() {        
        if (this.firstPendulum) {
            // updates the pendulum chain
            this.firstPendulum.update()

            // updates the trails
            this.trails.forEach((trail, i) => trail.opacity = 1 - i / this.maxTrails)

            // creates a new trail
            this.#createTrail(this.lastPendulum.endX, this.lastPendulum.endY, this.lastPendulum.ballRadius)

            this.#popTrail()
        }
    }

    /**
     * Creates and appends the trail to the start if there are less than maxTrails
     * @param {number} x x coordinate
     * @param {number} y y coordinate
     * @param {number} radius radius
     */
    #createTrail(x, y, radius) {
        if (this.trails.length <= this.maxTrails) {
            this.trails.unshift(new Trail(this.ctx, x, y, radius))
        }
    }

    /**
     * Removes the last trail if there are more than maxTrails
     */
    #popTrail() {
        if (this.trails.length > this.maxTrails) {
            this.trails.pop()
        }
    }
}

class Trail {
    /**
     * Creates a trail
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
}

/**
 * Creates an element representing a numeric attribute of the pendulum and returns the label and input
 * @param {string} attribute pendulum attribute name (label)
 * @param {any} initialValue initial value
 * @returns an object containing the label and the input
 */
function createHTMLPendulumAttributeNumber(attribute, initialValue) {
    // creates the elements
    const label = document.createElement('label')
    label.className = 'pendulum-number-attribute'

    const spanWrapper = document.createElement('div')
    spanWrapper.className = 'pendulum-input-info-wrapper'

    const span = document.createElement('span')
    span.className = 'pendulum-input-info'
    span.innerText = attribute + ':'

    const input = document.createElement('input')
    input.className = 'pendulum-input-number'
    input.type = 'number'
    input.value = initialValue

    // appends the children
    spanWrapper.appendChild(span)

    label.append(spanWrapper, input)

    return {
        label,
        input,
    }
}

/**
 * Creates an element representing a color attribute of the pendulum and returns the label and input
 * @param {string} iconName icon name
 * @param {any} initialValue initial value
 * @returns an object containing the label and the input
 */
function createHTMLPendulumAttributeColor(iconName, initialValue) {
    // creates the elements
    const label = document.createElement('label')
    label.className = 'pendulum-color-attribute'

    const iconWrapper = document.createElement('div')
    iconWrapper.className = 'icon-wrapper'

    const icon = document.createElement('span')
    icon.className = iconName

    const inputWrapper = document.createElement('div')
    inputWrapper.className = 'pendulum-input-color-wrapper'

    const input = document.createElement('input')
    input.className = 'pendulum-input-color'
    input.type = 'color'
    input.value = initialValue
    
    // appends the children
    iconWrapper.appendChild(icon)
    inputWrapper.appendChild(input)

    label.append(iconWrapper, inputWrapper)

    return {
        label,
        input,
    }
}

/**
 * Creates a button with an icon
 * @param {string} buttonClass button class
 * @param {string} iconName icon name
 * @param {() => void} clickCallback callback to be executed when the button is clicked
 * @returns a button
 */
function createHTMLPendulumButton(buttonClass, iconName, clickCallback) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = buttonClass
    button.addEventListener('click', clickCallback)

    const icon = document.createElement('div')
    icon.className = iconName

    button.appendChild(icon)

    return button
}

/**
 * Creates an element representing the pendulum
 * @param {Pendulum} pendulum 
 * @returns an element representing the pendulum
 */
function createHTMLPendulum(pendulum) {
    const divPendulum = document.createElement('div')
    divPendulum.className = 'pendulum'

    // container for the inputs
    const divPendulumAttributes = document.createElement('div')
    divPendulumAttributes.className = 'pendulum-attributes'

    // container for the numeric inputs (helps to minimize the pendulum)
    const divPendulumNumberInputs = document.createElement('div')
    divPendulumNumberInputs.className = 'pendulum-number-inputs'

    // creates the numeric inputs
    const labelSpeed = createHTMLPendulumAttributeNumber('Speed', pendulum.angularSpeed)
    labelSpeed.input.addEventListener('input', function() {
        const value = parseFloat(labelSpeed.input.value || 0)
        pendulum.angularSpeed = value
        chaoticPendulum.resetTrail()
    })

    const labelLength = createHTMLPendulumAttributeNumber('Length', pendulum.length)
    labelLength.input.min = 0
    labelLength.input.addEventListener('input', function() {
        const value = parseFloat(labelLength.input.value || 0)
        pendulum.length = value < 0 ? 0 : value
        draw()
        chaoticPendulum.resetTrail()
    })
    labelLength.input.addEventListener('change', function() {
        labelLength.input.value = pendulum.length
    })

    const labelDegrees = createHTMLPendulumAttributeNumber('Degrees', toDegrees(pendulum.radians).toFixed(3))
    labelDegrees.input.min = 0
    labelDegrees.input.max = 359
    labelDegrees.input.addEventListener('input', function() {
        const value = parseFloat(labelDegrees.input.value || 0)
        pendulum.radians = (FULL_RADIANS + toRadians(value) % FULL_RADIANS) % FULL_RADIANS
        draw()
        chaoticPendulum.resetTrail()
    })
    labelDegrees.input.addEventListener('change', function() {
        labelDegrees.input.value = toDegrees(pendulum.radians).toFixed(3)
    })

    addUpdateInput(labelDegrees.input, function() {
        const formattedRadians = (FULL_RADIANS + pendulum.radians % FULL_RADIANS) % FULL_RADIANS
        const degrees = toDegrees(formattedRadians).toFixed(3)
        return degrees
    })

    // container for the color inputs
    const colorsWrapper = document.createElement('div')
    colorsWrapper.className = 'colors-wrapper'

    // creates the color inputs
    const labelBallColor = createHTMLPendulumAttributeColor(
        'icon-ball',
        pendulum.ballColor,
        value => {
            pendulum.ballColor = value
            draw()
        }
    )
    labelBallColor.input.addEventListener('input', function() {
        pendulum.ballColor = labelBallColor.input.value
        draw()
    })

    const labelLineColor = createHTMLPendulumAttributeColor(
        'icon-line',
        pendulum.lineColor,
        value => {
            pendulum.lineColor = value
            draw()
        }
    )
    labelLineColor.input.addEventListener('input', function() {
        pendulum.lineColor = labelLineColor.input.value
        draw()
    })

    // creates the buttons
    const btnRemovePendulum = createHTMLPendulumButton(
        'btn-remove-pendulum',
        'icon-x',
        () => {
            chaoticPendulum.removePendulum(pendulum)
            divPendulum.remove()
            draw()
        }
    )

    const btnMinimizePendulum = createHTMLPendulumButton(
        'btn-minimize-pendulum',
        'icon-chevron',
        () => divPendulum.classList.toggle('minimized')
    )

    // appends the children
    divPendulumNumberInputs.append(labelSpeed.label, labelLength.label, labelDegrees.label)

    colorsWrapper.append(labelBallColor.label, labelLineColor.label)

    divPendulumAttributes.append(divPendulumNumberInputs, colorsWrapper)

    divPendulum.append(divPendulumAttributes, btnRemovePendulum, btnMinimizePendulum)

    return divPendulum
}

/**
 * Creates a pendulum and the HTML element representing it and returns it
 * @returns an element representing the pendulum
 */
function createPendulum() {
    const pendulum = chaoticPendulum.createPendulum(DEFAULT_PENDULUM_LENGTH, DEFAULT_PENDULUM_SPEED, DEFAULT_PENDULUM_RADIANS)

    const HTMLPendulum = createHTMLPendulum(pendulum)

    return HTMLPendulum
}

function addPendulum() {
    divPendulumParts.appendChild(createPendulum())
    draw()
    chaoticPendulum.resetTrail()
}

function togglePendulumInfo() {
    divPendulumInfoContainer.classList.toggle('closed')
}

/**
 * Creates an update input object which updates the input value from the code to the HTML
 * @param {HTMLInputElement} input input
 * @param {() => void} updateCallback callback to be executed whenever the canvas is updated by the update() function
 * @returns update input object
 */
function createUpdateObj(input, updateCallback) {
    return {
        input,
        update: () => input.value = updateCallback(),
    }
}

/**
 * Creates an update input object and adds it to the update inputs array
 * @param {HTMLInputElement} input input
 * @param {() => void} updateCallback callback to be executed whenever the canvas is updated by the update() function
 */
function addUpdateInput(input, updateCallback) {
    updateInputObjs.push(createUpdateObj(input, updateCallback))
}

/**
 * Clears the canvas
 */
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

/**
 * Draws the canvas
 */
function draw() {
    clear()
    
    // sets the context for drawing the pendulum in the right position and scale
    ctx.setTransform(canvasObj.scale, 0, 0, canvasObj.scale, canvasObj.x, canvasObj.y)

    chaoticPendulum.draw()

    // resets the context
    ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/**
 * Updates the canvas
 */
function update() {
    chaoticPendulum.update()

    updateInputObjs.forEach(inputObj => inputObj.update())
}

function startAnimation() {
    animationFrame = requestAnimationFrame(updateAnimation)

    // changes the visibility of the play and pause buttons
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

    // changes the visibility of the play and pause buttons
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
    const observer = new ResizeObserver(() => {
        const oldWidth = canvas.width
        const oldHeight = canvas.height

        resizeCanvas()

        const newX = canvasObj.x * canvas.width / oldWidth
        const newY = canvasObj.y * canvas.height / oldHeight

        canvasObj.setContextPosition(newX, newY)

        draw()
    })
    observer.observe(canvas)

    canvasObj.setContextPosition(canvas.width / 2, canvas.height / 2)
    divPendulumParts.appendChild(createPendulum())
    draw()
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
    
    canvasObj.translate(offsetX, offsetY)
    draw()
}

function handleStopMove() {
    prevX = 0
    prevY = 0
    isHolding = false
}

function zoom(zoom) {
    return function() {
        canvasObj.zoom(zoom)
        draw()
    }
}

const FULL_RADIANS = 2 * Math.PI

const ZOOM_IN = 1.2
const ZOOM_OUT = 1 / ZOOM_IN

// pendulum constants
const DEFAULT_PENDULUM_SPEED = 1
const DEFAULT_PENDULUM_LENGTH = 50
const DEFAULT_PENDULUM_RADIANS = Math.PI / 2

const MIN_TRAILS = 0
const MAX_TRAILS = 999_999

const zoomIn = zoom(ZOOM_IN)
const zoomOut = zoom(ZOOM_OUT)

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('chaotic-pendulum-canvas')

const divPendulumInfoContainer = document.querySelector('.pendulum-info-container')
// element where the pendulums are appended
const divPendulumParts = document.querySelector('.pendulum-parts')

// button to close the divPendulumInfoContainer
const btnClose = document.querySelector('#btn-close')
// button to add a new pendulum
const btnAddPendulum = document.querySelector('#btn-add')
// button to start the animation
const btnPlay = document.querySelector('#btn-play')
// button to stop the animation
const btnPause = document.querySelector('#btn-pause')
// button to zoom in the canvas
const btnZoomIn = document.querySelector('#btn-zoom-in')
// button to zoom out the canvas
const btnZoomOut = document.querySelector('#btn-zoom-out')
// button to remove trail
const btnRemoveTrail = document.querySelector('#btn-remove-trail')
// button to add trail
const btnAddTrail = document.querySelector('#btn-add-trail')

// input to set the number of trails
const inputTrails = document.querySelector('#input-trails')


const updateInputObjs = []

const ctx = canvas.getContext('2d')

const chaoticPendulum = new ChaoticPendulum(ctx, 0, 0)

const canvasObj = {
    x: 0,
    y: 0,
    scale: 1,
    setContextPosition(x, y) {
        this.x = x
        this.y = y
    },
    translate(x, y) {
        this.x += x
        this.y += y
    },
    zoom(zoom) {
        this.scale *= zoom
    }
}

let prevX = 0
let prevY = 0
let isHolding = false

let animationFrame = null

btnClose.addEventListener('click', togglePendulumInfo)

btnAddPendulum.addEventListener('click', addPendulum)

btnPlay.addEventListener('click', startAnimation)
btnPause.addEventListener('click', stopAnimation)

btnZoomIn.addEventListener('click', zoomIn)
btnZoomOut.addEventListener('click', zoomOut)

btnRemoveTrail.addEventListener('click', function() {
    chaoticPendulum.maxTrails--
    if (chaoticPendulum.maxTrails < MIN_TRAILS) chaoticPendulum.maxTrails = MIN_TRAILS
    inputTrails.value = chaoticPendulum.maxTrails
})
btnAddTrail.addEventListener('click', function() {
    chaoticPendulum.maxTrails++
    if (chaoticPendulum.maxTrails > MAX_TRAILS) chaoticPendulum = MAX_TRAILS
    inputTrails.value = chaoticPendulum.maxTrails
})

inputTrails.addEventListener('input', function() {
    let value = parseInt(inputTrails.value)

    if (!isNaN(value)) {
        if (value < MIN_TRAILS) {
            value = MIN_TRAILS
        } else if (value > MAX_TRAILS) {
            value = MAX_TRAILS
        }

        chaoticPendulum.maxTrails = value
        draw()
    }
})
inputTrails.addEventListener('change', function() {
    inputTrails.value = chaoticPendulum.maxTrails
})

// moving the canvas on mobile

canvas.addEventListener('touchstart', function(event) {
    const touch = event.touches[0]
    handleStartMove(touch.clientX, touch.clientY)
})

canvas.addEventListener('touchmove', function(event) {
    const touch = event.touches[0]
    handleMove(touch.clientX, touch.clientY)
})

canvas.addEventListener('touchend', handleStopMove)

// moving the canvas on computer

canvas.addEventListener('mousedown',  function(event) {
    handleStartMove(event.x, event.y)
})
canvas.addEventListener('mousemove',  function(event) {
    if (!isHolding) return

    handleMove(event.x, event.y)
})
document.addEventListener('mouseup', handleStopMove)

// zooms the canvas
canvas.addEventListener('wheel', e => (e.deltaY < 0 ? zoomIn : zoomOut)())

setUpCanvas()
