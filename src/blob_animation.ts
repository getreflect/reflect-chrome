interface BlobConfig {
  blur: number
  alphaMult: number
  alphaAdd: number
  numSeeds: number
  childrenPerSeed: number
  childrenDistanceRange: number
  circleMinRadius: number
  circleMaxRadius: number
  attraction: number
  repulsion: number
}

class BlobElement {
  fill: string = '#A6B1CE'
  x: number
  y: number
  r: number
  originalX: number
  originalY: number
  element: SVGCircleElement

  constructor(x: number, y: number, r: number) {
    this.x = this.originalX = x
    this.y = this.originalY = y
    this.r = r || 10
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'circle')

    // set styling
    this.element.setAttribute('r', this.r.toString())
    this.element.setAttribute('style', `fill: ${this.fill};`)
  }

  // update element
  update(mouseX: number, mouseY: number, repulsion: number, attraction: number): void {
    const dx = this.x - mouseX
    const dy = this.y - mouseY
    const angle = Math.atan2(dy, dx)
    const dist = repulsion / Math.sqrt(dx * dx + dy * dy)
    this.x += Math.cos(angle) * dist
    this.y += Math.sin(angle) * dist
    this.x += (this.originalX - this.x) * attraction
    this.y += (this.originalY - this.y) * attraction

    this.element.setAttribute('cx', this.x.toString())
    this.element.setAttribute('cy', this.y.toString())
  }
}

export default class BlobAnimation {
  width: number
  height: number
  centerX: number
  centerY: number

  // dom refs
  svg: HTMLElement
  colorMatrixF: HTMLElement
  elements: BlobElement[]

  // mouse
  mouseX: number
  mouseY: number

  config: BlobConfig = {
    blur: 8,
    alphaMult: 30,
    alphaAdd: -10,
    numSeeds: 8,
    childrenPerSeed: 3,
    childrenDistanceRange: 100,
    circleMinRadius: 15,
    circleMaxRadius: 75,
    attraction: 0.1,
    repulsion: 1000,
  }

  constructor() {
    // grab dom elements
    this.svg = document.getElementById('svg')
    this.colorMatrixF = document.getElementById('colorMatrixF')

    // bind event listeners
    const body = document.getElementById('reflect-main')
    window.addEventListener('resize', this.onResize, false)
    body.addEventListener(
      'mousemove',
      (e) => {
        this.mouseX = e.clientX
        this.mouseY = e.clientY
      },
      false
    )
    body.addEventListener('mouseleave', this.resetMouse, false)

    // create initial svg g elements
    this.onResize()
    this.resetMouse()
    this.initElements()
    this.colorMatrixF.setAttribute(
      'values',
      `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${this.config.alphaMult} ${this.config.alphaAdd}`
    )
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  private randomRange(targ: number, range: number): number {
    return targ + (Math.random() * 2 - 1) * range
  }

  private initElements(): void {
    // create group div with namespace
    this.elements = []
    const group: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    this.svg.appendChild(group)

    // create seeds
    for (let i = 0; i < this.config.numSeeds; i++) {
      const e: BlobElement = new BlobElement(
        this.randomRange(this.centerX, this.width * 0.4),
        this.randomRange(this.centerY, this.height * 0.4),
        this.random(this.config.circleMinRadius, this.config.circleMaxRadius)
      )

      e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction)
      group.appendChild(e.element)
      this.elements.push(e)
    }

    // add children to seeds
    this.elements.forEach((e) => {
      for (let j = 0; j < this.config.childrenPerSeed; j++) {
        const child: BlobElement = new BlobElement(
          this.randomRange(e.x, this.config.childrenDistanceRange),
          this.randomRange(e.y, this.config.childrenDistanceRange),
          this.random(this.config.circleMinRadius, this.config.circleMaxRadius)
        )

        child.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction)
        group.appendChild(child.element)
        this.elements.push(child)
      }
    })
  }

  // set mouse cords back to bottom centre screen
  private resetMouse(): void {
    this.mouseX = this.centerX
    this.mouseY = 5 * this.centerY
  }

  // recompute width, height, and centre
  private onResize(): void {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.centerX = this.width / 2
    this.centerY = this.height / 2
  }

  animate = () => {
    requestAnimationFrame(this.animate)
    this.elements.forEach((e) => {
      e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction)
    })
  }
}
