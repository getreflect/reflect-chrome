// blob_animation.ts is a module which provides a class to easily instantiate the animations on the block page
class BlobElement {
    constructor(x, y, r, is3D) {
        this.x = this.originalX = x;
        this.y = this.originalY = y;
        this.r = r || 10;
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.fill = is3D ? 'url(#_r_gradient)' : '#A6B1CE';
        // set styling
        this.element.setAttribute('r', this.r.toString());
        this.element.setAttribute('style', `fill: ${this.fill};`);
    }
    // update element
    update(mouseX, mouseY, repulsion, attraction) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const angle = Math.atan2(dy, dx);
        const dist = repulsion / Math.sqrt(dx * dx + dy * dy);
        this.x += Math.cos(angle) * dist;
        this.y += Math.sin(angle) * dist;
        this.x += (this.originalX - this.x) * attraction;
        this.y += (this.originalY - this.y) * attraction;
        this.element.setAttribute('cx', this.x.toString());
        this.element.setAttribute('cy', this.y.toString());
    }
}
export default class BlobAnimation {
    constructor(is3D) {
        this.config = {
            blur: 8,
            alphaMult: 30,
            alphaAdd: -10,
            numSeeds: 6,
            childrenPerSeed: 4,
            childrenDistanceRange: 125,
            circleMinRadius: 15,
            circleMaxRadius: 75,
            attraction: 0.1,
            repulsion: 1000,
        };
        this.animate = () => {
            requestAnimationFrame(this.animate);
            this.elements.forEach((e) => {
                e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
            });
        };
        this.is3D = is3D;
        // grab dom elements
        this.svg = document.getElementById('svg');
        this.colorMatrixF = document.getElementById('colorMatrixF');
        // bind event listeners
        const body = document.getElementById('reflect-main');
        window.addEventListener('resize', this.onResize, false);
        body.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, false);
        body.addEventListener('mouseleave', this.resetMouse, false);
        // create initial svg g elements
        this.onResize();
        this.resetMouse();
        this.initElements();
        this.colorMatrixF.setAttribute('values', `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${this.config.alphaMult} ${this.config.alphaAdd}`);
    }
    random(min, max) {
        return min + Math.random() * (max - min);
    }
    randomRange(targ, range) {
        return targ + (Math.random() * 2 - 1) * range;
    }
    initElements() {
        // create group div with namespace
        this.elements = [];
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(group);
        // create seeds
        for (let i = 0; i < this.config.numSeeds; i++) {
            const e = new BlobElement(this.random(this.width * 0.4, this.width), this.randomRange(this.centerY, this.height * 0.4), this.random(this.config.circleMinRadius, this.config.circleMaxRadius), this.is3D);
            e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
            group.appendChild(e.element);
            this.elements.push(e);
        }
        // add children to seeds
        this.elements.forEach((e) => {
            for (let j = 0; j < this.config.childrenPerSeed; j++) {
                const child = new BlobElement(this.randomRange(e.x, this.config.childrenDistanceRange), this.randomRange(e.y, this.config.childrenDistanceRange), this.random(this.config.circleMinRadius, this.config.circleMaxRadius), this.is3D);
                child.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
                group.appendChild(child.element);
                this.elements.push(child);
            }
        });
    }
    // set mouse cords back to bottom centre screen
    resetMouse() {
        this.mouseX = this.centerX;
        this.mouseY = 5 * this.centerY;
    }
    // recompute width, height, and centre
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }
}
