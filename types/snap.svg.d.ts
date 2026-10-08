/**
 * Snap.svg ambient type declarations.
 *
 * These definitions are extracted from the project's JSDoc comments and provide
 * enough structure for editors and AI tooling to understand the runtime API.
 * The declarations intentionally focus on the public surface; helper members on
 * the private `_` namespace are modelled in a lightweight way so they remain
 * accessible for advanced use cases without over-specifying their shape.
 *
 * The callable factory is declared as a function merged with the `Snap`
 * namespace, keeping the value API and its public type names available together.
 */

// Snapshot point primitives --------------------------------------------------

declare namespace Snap {
	/** Two-dimensional point expressed as an object. */
	interface Point2D {
		/** Horizontal coordinate. */
		x: number;
		/** Vertical coordinate. */
		y: number;
	}

	/** Three-dimensional point expressed as an object. */
	interface Point3D extends Point2D {
		/** Optional depth coordinate. */
		z?: number | undefined;
	}

	/** Three-dimensional point with homogeneous coordinate returned by matrix helpers. */
	interface Point4D extends Point3D {
		w?: number | undefined;
	}

	/** Complex number represented by its real and imaginary components. */
	interface ComplexNumber {
		re: number;
		im: number;
	}

	/** Four coefficients defining a Möbius transform. */
	interface MobiusCoefficients {
		a: ComplexNumber;
		b: ComplexNumber;
		c: ComplexNumber;
		d: ComplexNumber;
	}

	/** Ordered list of 2D points represented as objects. */
	type Point2DList = Array<Point2D>;

	/** Ordered list of 3D points represented as objects. */
	type Point3DList = Array<Point3D>;

	/** Pair of numeric coordinates. */
	type NumberPair = [number, number];

	/** Tuple containing the resolved border size and the increment mode flag. */
	type NumberBooleanTuple = [number, boolean];

	/** Timeout specification that can be passed as a number or `[value, step]` pair. */
	type TimeLimitSpecifier = number | NumberPair;

	/** Supported inputs for hull computations (tuple pairs, flat arrays, or point objects). */
	type PointCollection = Array<NumberPair | number | Point2D>;

	/** Acceptable argument for vector helpers. */
	type VectorInput = Point2D | NumberPair;
	type Vector3Input = Point3D | [number, number, number];

	/** Polar coordinates returned by conversion helpers. */
	interface PolarCoordinates {
		/** Angle component, expressed either in radians or degrees depending on the helper. */
		phi: number;
		/** Radius component. */
		r: number;
	}

	/** Detailed information about a point sampled along a path. */
	interface PointOnPath extends Point2D {
		/** Tangent angle in degrees. */
		alpha: number;
		/** Optional cached segment length from the previous anchor. */
		length?: number | undefined;
		/** Optional parametric position between 0 and 1. */
		t?: number | undefined;
		/** Optional left handle for cubic curves. */
		m?: Point2D | undefined;
		/** Optional right handle for cubic curves. */
		n?: Point2D | undefined;
		/** Optional start anchor for the current Bezier segment. */
		start?: Point2D | undefined;
		/** Optional end anchor for the current Bezier segment. */
		end?: Point2D | undefined;
	}

	/** Detailed point metadata returned by Bézier helpers. */
	type BezierDot = PointOnPath & { m: Point2D; n: Point2D; start: Point2D; end: Point2D };

	/** Attribute key configuration describing how virtual nodes store metadata. */
	interface AttributeKeyConfiguration {
		/** Key for a single attribute entry. */
		attr?: string | undefined;
		/** Key for the attribute collection. */
		attributes?: string | undefined;
		/** Key that stores the node type. */
		type?: string | undefined;
		/** Key that stores child nodes. */
		children?: string | undefined;
	}

	/** Rectangular range definition with inclusive bounds. */
	interface Range {
		/** Lower bound. */
		min: number;
		/** Upper bound. */
		max: number;
	}

	/** Axis-aligned bounding ranges for up to three dimensions. */
	interface Range3D {
		/** Bounds along the X axis. */
		x: Range;
		/** Bounds along the Y axis. */
		y: Range;
		/** Optional bounds along the Z axis. */
		z?: Range | undefined;
	}

	/** Circle descriptor used by bounding box helpers. */
	interface Circle {
		/** Centre X coordinate. */
		x: number;
		/** Centre Y coordinate. */
		y: number;
		/** Circle radius. */
		r: number;
	}

	/** Extrema collections grouped per axis along with the sorted values. */
	interface ExtremaCollection {
		/** Parameter values yielding extrema in X. */
		x: number[];
		/** Parameter values yielding extrema in Y. */
		y: number[];
		/** Optional extrema parameters for Z. */
		z?: number[] | undefined;
		/** Unique extrema parameters. */
		values: number[];
	}

	/** Cached offset geometry information for a Bezier curve. */
	interface OffsetGeometry {
		/** Curve metadata. */
		c: Record<string, unknown>;
		/** Normal metadata. */
		n: Record<string, unknown>;
		/** X coordinate of the offset point. */
		x: number;
		/** Y coordinate of the offset point. */
		y: number;
		/** Optional Z coordinate of the offset point. */
		z?: number | undefined;
	}

	/** Minimal bounding box descriptor supporting extended coordinates. */
	interface BoundsLike {
		/** Left coordinate. */
		x: number;
		/** Top coordinate. */
		y: number;
		/** Optional right coordinate. */
		x2?: number | undefined;
		/** Optional bottom coordinate. */
		y2?: number | undefined;
	}

	/** Specification describing how to fetch a resource, potentially with a payload. */
	type ResourceSpecifier = string | Array<string | unknown>;

	/**
	 * Two-dimensional bounding box enriched with helper methods used across the
	 * DOM abstraction. The object returned by {@link Element#getBBox} adheres to
	 * this shape.
	 */
	interface BBox {
		/** Top-left X coordinate. */
		x: number;
		/** Top-left Y coordinate. */
		y: number;
		/** Box width. */
		width: number;
		/** Box height. */
		height: number;
		/** Bottom-right X coordinate. */
		x2: number;
		/** Bottom-right Y coordinate. */
		y2: number;
		/** Horizontal centre. */
		cx: number;
		/** Vertical centre. */
		cy: number;
		/** Width alias maintained by the bounding-box helper. */
		w: number;
		/** Height alias maintained by the bounding-box helper. */
		h: number;
		/** SVG path command array outlining the box. */
		path(): PathSegmentArray;
		/** Clones this bounding box. */
		clone(): BBox;
		/** Returns the largest inscribed-circle radius. */
		r1(): number;
		/** Returns the smallest enclosing-circle radius. */
		r2(): number;
		/** Returns half of the diagonal length. */
		r0(): number;
		/** Returns the diagonal length. */
		diag(): number;
		/** Expands this box by padding and returns the mutated or copied box. */
		addBorder(border?: number | number[] | Record<string, number>, getNew?: boolean): BBox;
		/** Draws the box as a rectangle on the supplied paper. */
		rect(paper: Paper, radius?: number | NumberPair | { rx?: number; ry?: number }, border?: number | number[] | Record<string, number>): Element;
		/** Returns the box as a viewBox string. */
		vb(): string;
		/** Returns the aspect ratio. */
		ratio(): number;
		/** Tests whether this box contains a point or another box. */
		contains(value: Point2D | BoundsLike | BBox, clearance?: number): boolean;
		/** Tests whether this box contains a circle. */
		containsCircle(circle: Circle): boolean;
		/** Returns the box centre. */
		center(): Point2D;
		/** Returns one of the box corners. */
		corner(count: number): Point2D | undefined;
		/** Returns a named point on the box. */
		pointFromName(name: string): Point2D | null;
		/** Returns the bounds after rotation. */
		getBBoxRot(angle: number): BBox;
		/** Returns the intersection between this box and another box. */
		intersect(other: BoundsLike | BBox): BBox | null;
		/** Tests whether this box overlaps another box. */
		isOverlap(other: BoundsLike | BBox): boolean;
		/** Returns the union between this box and another box. */
		union(other: BoundsLike | BBox): BBox;
		/** Sets the box corner at `x`, `y`. */
		setCorner(x: number, y: number): this;
		/** Translates the box. */
		translate(x: number, y: number): this;
		/** Scales the box around an optional pivot. */
		scale(sx: number, sy?: number, cx?: number, cy?: number): this;
		/** Returns the box itself as a bounding box. */
		getBBox(): BBox;
		/** Returns a formatted string `"x y width height"`. */
		toString(): string;
	}

	/** Point-mapping function accepted by non-linear transform builders. */
	type PointTransform = (point: Point3D) => Point3D | null | undefined;

	/** Options for projective 3D matrix transformations. */
	interface Matrix3DOptions {
		origin?: Point3D | NumberPair | undefined;
		divideByW?: boolean | undefined;
		fallbackPoint?: Point3D | undefined;
		project?: ((point: Point4D, source: Point3D) => Point3D | null | undefined) | undefined;
	}

	/** Shared options for axis-oriented 2D transforms. */
	interface AxisTransformOptions {
		origin?: Point2D | NumberPair | undefined;
		defaultAxis?: "x" | "y" | undefined;
	}

	/** Public non-linear transform builder and registry. */
	interface NonlinTransforms {
		identity: PointTransform;
		register(name: string, factory: (...args: any[]) => PointTransform | null): this;
		has(name: string): boolean;
		list(): string[];
		build(name: string, ...args: any[]): PointTransform | null;
		compose(...transforms: Array<PointTransform | MatrixLike | Array<PointTransform | MatrixLike> | null | undefined>): PointTransform;
		use(presets: string | Array<string | Record<string, unknown>> | Record<string, unknown>): this;
		parametrize(transform: string | PointTransform, parameters: unknown[], easing?: MinaEasing | MinaEasing[]): (progress: number) => PointTransform | null;
		twistPinch(center: Point2D | NumberPair, radius: number, twist: number, pinch: number): PointTransform;
		radialRipple(center: Point2D | NumberPair, amplitude: number, wavelength: number, decay?: number, phase?: number): PointTransform;
		bulge(center: Point2D | NumberPair, radius: number, strength: number): PointTransform;
		mobius(a?: unknown, b?: unknown, c?: unknown, d?: unknown): PointTransform;
		mobiusDisk(center: Point2D | NumberPair, angle?: number, options?: Record<string, unknown>): PointTransform;
		mobiusUpperHalfPlane(shift?: number, scale?: number, tilt?: number, options?: Record<string, unknown>): PointTransform;
		mobiusAnchors(source: ComplexNumber[], target: ComplexNumber[], options?: Record<string, unknown>): PointTransform;
		sineWave(axis: string | Point2D | NumberPair, amplitude: number, wavelength: number, phase?: number, decay?: number): PointTransform;
		cantilever(origin: Point2D | NumberPair, length: number, flexuralRigidity: number, tipAngle: number, gain?: number, axis?: unknown, falloff?: number): PointTransform;
		springBend(origin: Point2D | NumberPair, length: number, angle: number, gain?: number, axis?: unknown, falloff?: number): PointTransform;
		bendCantilever(fixed: Point2D | NumberPair, tip: Point2D | NumberPair, tipAngle: number, falloff?: number): PointTransform;
		matrix3d(matrix: string | number[] | number[][] | Record<string, number>, options?: Matrix3DOptions): PointTransform;
		translate3d(x: number, y: number, z: number, options?: Matrix3DOptions): PointTransform;
		scale3d(x: number, y?: number, z?: number, options?: Matrix3DOptions): PointTransform;
		rotateX(angle: number, options?: Matrix3DOptions): PointTransform;
		rotateY(angle: number, options?: Matrix3DOptions): PointTransform;
		rotateZ(angle: number, options?: Matrix3DOptions): PointTransform;
		rotate3d(axis: Point3D | NumberPair | [number, number, number] | "x" | "y" | "z", angle: number, options?: Matrix3DOptions): PointTransform;
		perspective(distance: number, options?: Matrix3DOptions): PointTransform;
		lookAt(eye: Point3D, target: Point3D, up?: Point3D, options?: Matrix3DOptions): PointTransform;
		[key: string]: any;
	}

	/** Static complex-number utilities exposed as `Snap.Complex`. */
	interface ComplexStatic {
		readonly ZERO: Readonly<ComplexNumber>;
		readonly ONE: Readonly<ComplexNumber>;
		from(value: unknown, fallback?: ComplexNumber): ComplexNumber;
		fromPoint(value: Point2D): ComplexNumber;
		add(a: unknown, b: unknown): ComplexNumber;
		sub(a: unknown, b: unknown): ComplexNumber;
		neg(value: unknown): ComplexNumber;
		mul(a: unknown, b: unknown): ComplexNumber;
		absSq(value: unknown): number;
		conj(value: unknown): ComplexNumber;
		div(a: unknown, b: unknown): ComplexNumber;
		isZero(value: unknown, threshold?: number): boolean;
		scale(value: unknown, scalar: number): ComplexNumber;
		equals(a: unknown, b: unknown, epsilon?: number): boolean;
		normalizeCoefficients(a?: unknown, b?: unknown, c?: unknown, d?: unknown): MobiusCoefficients;
		_parseNumber(value: unknown, fallback: number): number;
	}

	/** Named font namespace extension, backed by the optional dynamic font plugin. */
	interface FontNamespace {
		load(urlOrName: string, nameOrOptions?: string | FontLoadOptions, options?: FontLoadOptions): Promise<Font>;
		get(name: string, autoLoad?: false): Font | null;
		get(name: string, autoLoad: true): Font | Promise<Font> | null;
		ensure(nameOrUrl: string, name?: string): Promise<Font>;
		list(): string[];
		remove(name: string): boolean;
		findFontUrl(name: string, options?: FontLoadOptions): string | null;
		recover(pathGroup: Element): Element | null;
		[key: string]: any;
	}

	interface FontLoadOptions {
		force?: boolean | undefined;
		autoLoad?: boolean | undefined;
		format?: string | undefined;
		doc?: Document | undefined;
		[key: string]: unknown;
	}

	interface Font {
		name?: string | undefined;
		textToPath(text: string, options?: Record<string, unknown>): Element;
		textToBeziers(text: string, options?: Record<string, unknown>): unknown[];
		[key: string]: any;
	}

	interface FilterNamespace {
		blur(x?: number, y?: number): string;
		shadow(dx?: number, dy?: number, blur?: number, color?: string, opacity?: number): string;
		grayscale(amount?: number): string;
		sepia(amount?: number): string;
		saturate(amount?: number): string;
		hueRotate(angle?: number): string;
		invert(amount?: number): string;
		brightness(amount?: number): string;
		contrast(amount?: number): string;
		[key: string]: (...args: any[]) => string;
	}

	/** Polygon intersection helpers in `Snap.polygons`. */
	interface PolygonNamespace {
		intersect(first: Point2DList, second: Point2DList): Point2DList[] | false;
		[key: string]: any;
	}

	interface NamedColor {
		readonly [level: number]: string;
		readonly A100?: string;
		readonly A200?: string;
		readonly A400?: string;
		readonly A700?: string;
	}

	interface MaterialColors {
		[key: string]: NamedColor;
	}

	interface FlatColors {
		[key: string]: string;
	}

	interface BBoxStatic {
		new (x: number | number[] | BoundsLike | BBox | null, y?: number, width?: number, height?: number): BBox;
		prototype: BBox;
	}

	// Matrix -------------------------------------------------------------------

	/**
	 * Representation of a 2D transformation matrix. Methods mutate the matrix in
	 * place unless otherwise declared and return `this` for chaining.
	 */
	class Matrix {
		a: number;
		b: number;
		c: number;
		d: number;
		e: number;
		f: number;
		constructor(a?: number | SVGMatrix | string | MatrixLike, b?: number, c?: number, d?: number, e?: number, f?: number);
		/** Clone the matrix. */
		clone(): Matrix;
		/** Replace the matrix components with the supplied values. */
		add(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;
		/** Multiply the matrix on the right by another matrix or coefficient tuple. */
		multRight(matrix: MatrixLike): Matrix;
		/** Multiply the matrix on the right by another matrix or coefficient tuple. */
		multRight(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;
		/** Return a new matrix equal to this matrix multiplied on the right by the supplied transform. */
		plus(matrix: MatrixLike): Matrix;
		/** Return a new matrix equal to this matrix multiplied on the right by the supplied transform. */
		plus(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;
		/** Scale all coefficients by the supplied scalar. */
		scMult(scalar: number): Matrix;
		/** Return a scaled clone of the matrix. */
		timesSc(scalar: number): Matrix;
		/** Multiply the matrix on the left by another matrix or coefficient tuple. */
		multLeft(matrix: MatrixLike | MatrixLike[]): Matrix;
		/** Multiply the matrix on the left by another matrix or coefficient tuple. */
		multLeft(a: number, b: number, c: number, d: number, e: number, f: number): Matrix;
		/** Translate the matrix by the supplied delta. */
		translate(tx: number, ty: number): Matrix;
		/** Scale around the origin or around the optional pivot. */
		scale(sx: number, sy?: number, cx?: number, cy?: number): Matrix;
		/** Skew by the provided angle along the X axis. */
		skewX(angle: number): Matrix;
		/** Skew by the provided angle along the Y axis. */
		skewY(angle: number): Matrix;
		/** Skew along both axes. */
		skew(x: number, y?: number): Matrix;
		/** Rotate by the specified angle (degrees) optionally around a pivot. */
		rotate(angle: number, cx?: number, cy?: number): Matrix;
		/** Apply this matrix to a point, optionally using another element's coordinate space. */
		apply(point: Point2D | NumberPair, node?: Element): Point2D;
		/** Returns a randomized transform applied to this matrix. */
		randomTrans(cx?: number, cy?: number, positive?: boolean, distance?: number, diffScale?: boolean, skipRotation?: boolean, skipScale?: boolean): Matrix;
		/** Returns a rounded coefficient by its index. */
		get(index: number): number;
		/** Returns the translation components. */
		offset(): [string, string];
		/** Compares this matrix with another matrix within a tolerance. */
		equals(other: MatrixLike, error?: number): boolean;
		/** Returns all six coefficients as an array. */
		toArray(): number[];
		/** Returns this matrix as a 2D array. */
		to2dArray(): number[][];
		/** Decomposes this matrix into transform components. */
		split(addPreTranslation?: boolean): Record<string, number | boolean>;
		/** Returns an alternate decomposition into transform components. */
		split2(): Record<string, number | boolean>;
		/** Returns the matrix as SVG transform commands. */
		toTransformString(shorter?: boolean): string;
		/** Determines whether this is a finite matrix. */
		isMatrix(): boolean;
		/** Decomposes the transform into rotation and scale components. */
		rotScaleSplit(matrix?: MatrixLike): Record<string, number>;
		/** Return the inverse matrix. */
		invert(): Matrix;
		/** Returns an SVG matrix string. */
		toString(): string;
		/** Returns `true` when this matrix is the identity matrix. */
		isIdentity(error?: number): boolean;
		/** Transform X coordinate given the source pair. */
		x(x: number, y: number): number;
		/** Transform Y coordinate given the source pair. */
		y(x: number, y: number): number;
		/** Matrix determinant. */
		determinant(): number;
		/** Solve a two-point transform mapping to two target points. */
		twoPointTransform(p1x: number, p1y: number, p2x: number, p2y: number, toP1x: number, toP1y: number, toP2x: number, toP2y: number): Matrix | null;
		static random(cx?: number, cy?: number, positive?: boolean, distance?: number, diffScale?: boolean, skipRotation?: boolean, skipScale?: boolean): Matrix;
		static combine(translate?: unknown, scale?: unknown, angle?: number, shear?: number): Matrix;
		static gen: MatrixGeneralOperations;
	}

	interface MatrixGeneralOperations {
		add(a: Matrix | number[][], b: Matrix | number[][]): number[][];
		multiply(a: Matrix | number[][], b: Matrix | number[][]): number[][];
		cMultiply(scalar: number, matrix: Matrix | number[][]): number[][];
	}

	interface MatrixStatic {
		new (a?: number | SVGMatrix | string | MatrixLike, b?: number, c?: number, d?: number, e?: number, f?: number): Matrix;
		prototype: Matrix;
		random(cx?: number, cy?: number, positive?: boolean, distance?: number, diffScale?: boolean, skipRotation?: boolean, skipScale?: boolean): Matrix;
		combine(translate?: unknown, scale?: unknown, angle?: number, shear?: number): Matrix;
		gen: MatrixGeneralOperations;
	}

	interface XMLNamespaces {
		svg: string;
		xlink: string;
		xmlns: string;
		xml: string;
		html: string;
		[key: string]: string;
	}

	/** Permitted inputs when a method accepts a transformation matrix. */
	type MatrixLike = Matrix | SVGMatrix | [number, number, number, number, number, number];

	// Colour -------------------------------------------------------------------

	/** RGBA colour description produced by {@link Snap.getRGB}. */
	interface RGBColor {
		/** Red channel. */
		r: number;
		/** Green channel. */
		g: number;
		/** Blue channel. */
		b: number;
		/** Alpha channel in the `[0, 1]` range. */
		opacity: number;
		/** Hexadecimal representation prefixed with `#`. */
		hex: string;
		/** True when the input could not be parsed. */
		error: boolean;
		/** Custom stringifier returning the hex form. */
		toString(): string;
	}

	/** CMYK colour description used by conversion helpers. */
	interface CMYKColor {
		/** Cyan channel in the `[0, 1]` range. */
		c: number;
		/** Magenta channel in the `[0, 1]` range. */
		m: number;
		/** Yellow channel in the `[0, 1]` range. */
		y: number;
		/** Key (black) channel in the `[0, 1]` range. */
		k: number;
	}

	/** RGB triplet returned by CMYK conversion helpers. */
	interface RGBTriplet {
		/** Red channel expressed as an integer. */
		r: number;
		/** Green channel expressed as an integer. */
		g: number;
		/** Blue channel expressed as an integer. */
		b: number;
	}

	/** Generic attribute value accepted by {@link Element#attr}. */
	type AttrValue = string | number | boolean | null | undefined | AttrValue[] | MatrixLike | RGBColor;

	/** Map of attribute names to values. */
	interface Attributes {
		[name: string]: AttrValue;
	}

	// Animation ----------------------------------------------------------------

	/** Numeric value (or array of numeric values) animated by mina. */
	type AnimationValue = number | number[];

	/** Callback returning the current master value that drives the animation timeline. */
	type MinaGetter = () => number;

	/** Callback that applies the interpolated value. */
	type MinaSetter<T = AnimationValue> = (value: T) => void;

	/** Animation easing function. */
	type MinaEasing = (t: number) => number;

	/** Attribute-animation descriptor returned by {@link Snap.animation}. */
	interface AnimationDescriptor {
		attr: Attributes;
		dur: number;
		easing: MinaEasing;
		callback?: ((animation: MinaAnimation) => void) | undefined;
	}

	/** Helper signature for easing factories that expose a `.withParams` builder. */
	type MinaEasingFactory = ((...args: any[]) => MinaEasing) & { withParams: (...args: any[]) => MinaEasing };

	/** Descriptor returned by {@link mina}. */
	interface MinaAnimation<T = AnimationValue> {
		/** Animation identifier. */
		readonly id: string;
		/** Starting value(s). */
		start: T;
		/** Ending value(s). */
		end: T;
		/** Starting master value. */
		b: number;
		/** Current progress in the `[0, 1]` range. */
		s: number;
		/** Duration in timeline units. */
		dur: number;
		/** Getter invoked to retrieve the current master value. */
		get: MinaGetter;
		/** Setter invoked with the interpolated value during updates. */
		set: MinaSetter<T>;
		/** Active easing function. */
		easing: MinaEasing;
		/** Playback speed multiplier. */
		spd: number;
		/** Frame skipping factor. */
		skip: number;
		/** Indicates whether playback is reversed. */
		rev: boolean;
		/** Pause the animation, preserving the timeline offset. */
		pause(): void;
		/** Resume a previously paused animation. */
		resume(): void;
		/** Stop the animation immediately and emit the completion event. */
		stop(): void;
		/** Reverse the animation direction. */
		reverse(keepProgress?: boolean): void;
		/** Returns current status as a fraction between 0 and 1. */
		status(): number;
		/** Sets current status, returning `this`. */
		status(value: number): MinaAnimation<T>;
		/** Returns current playback speed. */
		speed(): number;
		/** Sets playback speed. */
		speed(value: number): MinaAnimation<T>;
		/** Returns the animation duration. */
		duration(): number;
		/** Sets the animation duration. */
		duration(value: number): MinaAnimation<T>;
		/** Attach completion callbacks. */
		then(callback: (animation: MinaAnimation<T>) => void): Promise<void>;
		/** Apply the easing function and update the animated value. */
		update(): void;
		/** Boolean shortcut indicating whether the animation already finished. */
		done(): boolean;
	}

	/** Namespace that augments the `mina` timing engine. */
	interface MinaNamespace {
		/** Exposes the `Animation` constructor for advanced use cases. */
		Animation: new <T = AnimationValue>(a: T, A: T, b: number, B: number, get: MinaGetter, set: MinaSetter<T>, easing?: MinaEasing) => MinaAnimation<T>;
		/** Returns the current timestamp in milliseconds. */
		time(): number;
		/** CSS-like `ease` timing. */
		ease: MinaEasing;
		/** CSS-like `ease-in` timing. */
		easeIn: MinaEasing;
		/** CSS-like `ease-out` timing. */
		easeOut: MinaEasing;
		/** CSS-like `ease-in-out` timing. */
		easeInOut: MinaEasing;
		/** Default linear easing. */
		linear(n: number): number;
		/** Exponential ease-out easing. */
		easeout(n: number): number;
		/** Exponential ease-in easing. */
		easein(n: number): number;
		/** Sine-based ease-in/out easing. */
		easeinout(n: number): number;
		/** Bounce easing. */
		bounce(n: number): number;
		/** Bounce easing with configurable parameters. */
		bounceGen: MinaEasingFactory;
		/** Bounce ease-in helper. */
		bounceIn: MinaEasing;
		/** Bounce ease-out helper (alias of {@link bounce}). */
		bounceOut: MinaEasing;
		/** Bounce ease-in-out helper. */
		bounceInOut: MinaEasing;
		/** Regular cubic-bezier easing factory. */
		bezier(x1: number, y1: number, x2: number, y2: number): MinaEasing;
		/** CSS cubic-bezier factory with a cached `.withParams` variant. */
		cubicBezier: ((p1x: number, p1y: number, p2x: number, p2y: number) => MinaEasing) & { withParams(p1x: number, p1y: number, p2x: number, p2y: number): MinaEasing };
		/** Elastic easing factory. */
		elastic: MinaEasingFactory;
		/** Elastic ease-in wrapper. */
		elasticIn: MinaEasing;
		/** Elastic ease-out wrapper. */
		elasticOut: MinaEasing;
		/** Elastic ease-in-out wrapper. */
		elasticInOut: MinaEasing;
		/** Register an animation descriptor by its identifier. */
		getById(id: string): MinaAnimation | null;
		/** Determines whether a name maps to a registered easing helper. */
		isEasing(name: string): boolean;
		/** Updates the global speed multiplier for all animations. */
		setSpeed(speed?: number, skip?: number): void;
		/** Sets a global frame-skip interval for all animations. */
		setSkip(skip?: number): void;
		/** Pauses every running animation and managed timer. */
		pauseAll(): void;
		/** Resumes animations and timers paused via {@link pauseAll}. */
		resumeAll(): void;
		/** Stops all animations and timers. */
		stopAll(): void;
		/** Managed timeout that respects the global speed multiplier. */
		setTimeout(callback: (...args: any[]) => void, delay?: number, ...args: any[]): string | number;
		/** Immediate or delayed callback aligned with the global speed multiplier. */
		setTimeoutNow(callback: (...args: any[]) => any, delay?: number, ...args: any[]): any;
		/** Managed interval that respects the global speed multiplier. */
		setInterval(callback: (...args: any[]) => void, interval?: number, ...args: any[]): string | number;
		/** Clears a managed timeout. */
		clearTimeout(id: string | number): void;
		/** Clears a managed interval. */
		clearInterval(id: string | number): void;
		/** Enables skipped-frame tracking. */
		trakSkippedFrames(frameTime?: number): void;
		/** Returns the last animation(s) created or starts a new collection cycle. */
		getLast(start_collecting?: boolean): MinaAnimation | MinaAnimation[] | undefined;
		/** Sine easings. */
		easeInSine: MinaEasing;
		easeOutSine: MinaEasing;
		easeInOutSine: MinaEasing;
		easeOutInSine: MinaEasing;
		/** Quadratic easings. */
		easeInQuad: MinaEasing;
		easeOutQuad: MinaEasing;
		easeInOutQuad: MinaEasing;
		easeOutInQuad: MinaEasing;
		/** Cubic easings. */
		easeInCubic: MinaEasing;
		easeOutCubic: MinaEasing;
		easeInOutCubic: MinaEasing;
		easeOutInCubic: MinaEasing;
		/** Quartic easings. */
		easeInQuart: MinaEasing;
		easeOutQuart: MinaEasing;
		easeInOutQuart: MinaEasing;
		easeOutInQuart: MinaEasing;
		/** Quintic easings. */
		easeInQuint: MinaEasing;
		easeOutQuint: MinaEasing;
		easeInOutQuint: MinaEasing;
		easeOutInQuint: MinaEasing;
		/** Exponential easings. */
		easeInExpo: MinaEasing;
		easeOutExpo: MinaEasing;
		easeInOutExpo: MinaEasing;
		easeOutInExpo: MinaEasing;
		/** Circular easings. */
		easeInCirc: MinaEasing;
		easeOutCirc: MinaEasing;
		easeInOutCirc: MinaEasing;
		easeOutInCirc: MinaEasing;
		/** Anticipate helpers. */
		anticipate: MinaEasingFactory;
		anticipateOvershoot: MinaEasingFactory;
		anticipateBounce: MinaEasing;
		/** Spring helpers. */
		spring: MinaEasing;
		springIn: MinaEasing;
		springOut: MinaEasing;
		springInOut: MinaEasing;
		springDamped: ((frequency?: number, damping?: number, progress?: number) => number) & { withParams(frequency?: number, damping?: number): MinaEasing };
		/** Rubber-band easing. */
		rubber: ((tightness?: number, progress?: number) => number) & { withParams(tightness?: number): MinaEasing };
		rubberBand: MinaEasing;
		/** Compose and delay utilities. */
		compose: ((...easings: MinaEasing[]) => MinaEasing) & { withParams(...easings: MinaEasing[]): MinaEasing };
		delay: ((delayAmount?: number, easingCandidate?: MinaEasing) => MinaEasing) & { withParams(delayAmount?: number, easingCandidate?: MinaEasing): MinaEasing };
		delayHalf: MinaEasing;
		delayQuarter: MinaEasing;
		/** Pulse helpers. */
		pulseLinear: MinaEasingFactory;
		pulseEaseInOut: MinaEasingFactory;
		pulseDecay: MinaEasingFactory;
		pulse: MinaEasingFactory;
		/** Projectile-inspired easing. */
		projectile: ((mid_point?: number, progress?: number) => number) & { withParams(mid_point?: number): MinaEasing };
		/** Discrete steps easing helper. */
		steps: ((count?: number, position?: "start" | "end", progress?: number) => number) & { withParams(count?: number, position?: "start" | "end"): MinaEasing };
		/** Deterministic bounded noise easing. */
		noise: ((octaves?: number, frequency?: number, seed?: number, amplitude?: number, progress?: number) => number) & { withParams(octaves?: number, frequency?: number, seed?: number, amplitude?: number): MinaEasing };
		/** Helper easing combinations. */
		doubleSpring: MinaEasing;
		delayedSnap: MinaEasing;
		pulseIntro: MinaEasing;
		/** Creates a new animation descriptor and schedules it on the shared timeline. */
		(a: AnimationValue, A: AnimationValue, b: number, B: number, get: MinaGetter, set: MinaSetter, easing?: MinaEasing): MinaAnimation;
		/** Additional easing helpers not explicitly listed. */
		[key: string]: any;
	}

	// Core DOM wrappers --------------------------------------------------------

	/** Optional settings accepted by bounding-box helpers. */
	interface BBoxParameters {
		/** When `true`, applies the local transform before evaluation. */
		useLocalTransform?: boolean | undefined;
		/** Compatibility spelling accepted by older helper call sites. */
		without_transform?: boolean | undefined;
		/** Requests a fast approximate bounding box. */
		approx?: boolean | undefined;
		/** Ignore nodes hidden via display attributes. */
		skipHidden?: boolean | undefined;
		/** Compatibility spelling for hidden-node filtering. */
		skip_hidden?: boolean | undefined;
		/** Ignore stroke width. */
		ignoreStroke?: boolean | undefined;
	}

	/** Additional controls for `Element.animate`. */
	interface AnimationOptions {
		/** Animation duration in milliseconds. */
		duration?: number | undefined;
		/** Easing function. */
		easing?: MinaEasing | undefined;
		/** Called when the animation completes. */
		callback?: ((animation: MinaAnimation) => void) | undefined;
	}

	/** Opaque context bag accepted by drag helpers. */
	type DragContext = Record<string, unknown>;

	/** Configuration accepted by {@link Element#regionSelect}. */
	interface RegionSelectOptions {
		zoom?: number | undefined;
		eve?: (...args: any[]) => void;
		dash_size?: number | undefined;
		dashSize?: number | undefined;
		stroke_width?: number | undefined;
		strokeWidth?: number | undefined;
	}

	/** Result returned by {@link Element#getCanvasOverly}. */
	interface CanvasOverlay {
		container: Element;
		canvas: HTMLCanvasElement;
	}

	/** Fine-grained easing specification for {@link Element#animateTransform}. */
	interface TransformEasingSpec {
		default?: MinaEasing | undefined;
		dx?: MinaEasing | undefined;
		dy?: MinaEasing | undefined;
		scalex?: MinaEasing | undefined;
		scaley?: MinaEasing | undefined;
		rotate?: MinaEasing | undefined;
		shear?: MinaEasing | undefined;
	}

	/** Resolver accepted by the generative transform helpers. */
	type GenerativeTransformResolver = (progress: number) => ((...args: any[]) => any) | null;

	/**
	 * Shared surface implemented by both {@link Element} and {@link Paper}. The
	 * runtime keeps the two classes separate and copies methods between them, so
	 * the declaration models the common behaviour without implying inheritance.
	 */
	interface ElementLike {
		/** Underlying SVG DOM element. */
		node: SVGElement;
		/** Owning paper wrapper when available. */
		paper?: Paper | undefined;
		/** Element tag name in lowercase form. */
		type: string;
		/** Internal identifier used by the hub. */
		id: string;
		/** Returns the attribute value. */
		attr(name: string): AttrValue;
		/** Sets one attribute. */
		attr(name: string, value: AttrValue): this;
		/** Sets multiple attributes at once. */
		attr(attrs: Attributes): this;
		/** Removes attributes listed in {@link names}. */
		removeAttr(names: string | string[]): this;
		/** Appends a node to the current element. */
		append(element: Element | Element[] | Set<Element>, index?: number): this;
		/** Adds a node to the current element, optionally at an index. */
		add(element: Element | Element[] | Set<Element>, index?: number): this;
		/** Prepends a node to the current element. */
		prepend(element: Element | Element[] | Set<Element>): this;
		/** Appends this element to another element. */
		appendTo(element: Element): this;
		/** Prepends this element to another element. */
		prependTo(element: Element): this;
		/** Inserts the element before the supplied sibling. */
		insertBefore(element: Element): this;
		/** Inserts the element after the supplied sibling. */
		insertAfter(element: Element): this;
		/** Adds the element to the supplied parent at the beginning. */
		before(element: Element): this;
		/** Adds the element to the supplied parent at the end. */
		after(element: Element): this;
		/** Replaces this node with {@link element}. */
		replace(element: Element): Element;
		/** Clones the element, including data and optional deep children. */
		clone(hidden?: boolean, renameId?: ((id: string) => string) | null, deepCopy?: boolean): Element;
		/** Returns the computed bounding box. */
		getBBox(settings?: Partial<BBoxParameters>): BBox;
		/** Returns an approximate bounding box. */
		getBBoxApprox(settings?: Partial<BBoxParameters>): BBox;
		/** Returns an exact bounding box using the slow precise algorithm. */
		getBBoxExact(settings?: Partial<BBoxParameters>): BBox;
		/** Returns the bounding box for the element hierarchy. */
		getCHull(withTransform?: boolean, skipHidden?: boolean): Point2DList | null;
		/** Returns representative points describing the element footprint. */
		getPoints(useLocalTransform?: boolean, skipHidden?: boolean): Point2DList;
		/** Returns the convex-hull bounding box, or `null` for unresolved geometry. */
		getCHullBBox(matrix?: MatrixLike, skipHidden?: boolean): BBox | null;
		/** Clears the cached convex hull, optionally forcing a parent update. */
		clearCHull(forceTop?: boolean): this;
		/** Returns the path length. */
		getTotalLength(): number;
		/** Returns a point sample along the element geometry. */
		getPointSample(samples?: number): Point2DList | null;
		/** Returns a path point at the specified length. */
		getPointAtLength(length: number): PointOnPath;
		/** Returns a point sampled by normalised position `[0,1]`. */
		getPointAt(t: number): PointOnPath;
		/** Returns the nearest point on the path to the supplied coordinates. */
		getNearestPoint(x: number, y: number): Point2D;
		/** Saves the matrix for later reuse. */
		saveMatrix(matrix: MatrixLike): this;
		/** Returns the element's local matrix. */
		getLocalMatrix(strict?: boolean): Matrix;
		/** Returns the element's global matrix. */
		getGlobalMatrix(): Matrix;
		/** Apply a transform specified as string or matrix. */
		transform(transform?: string | MatrixLike, update?: boolean, matrix?: MatrixLike, apply?: boolean): this | string;
		/** Returns the transform encoded as an SVG matrix. */
		toMatrix(): Matrix;
		/** Applies incremental transformations. */
		matrix(matrix: MatrixLike): this;
		/** Returns the value of {@link attr} converted to pixels. */
		asPX(attr: string, value?: number | string): number;
		/** Binds a callback that observes attribute changes. */
		attrMonitor(attr: string, callback: (value: AttrValue) => void): () => void;
		/** Assigns a data slot. */
		data<T = unknown>(key: string, value: T): this;
		/** Reads a data slot. */
		data<T = unknown>(key: string): T | undefined;
		/** Removes the specified data slot. */
		removeData(key: string): this;
		/** Removes the element from the DOM. */
		remove(): this;
		/** Returns the parent Snap element if available. */
		parent(): Element | null;
		/** Returns child nodes wrapped as Snap elements. */
		children(copy?: boolean): Element[];
		/** Returns the next sibling Snap element. */
		next(): Element | null;
		/** Returns the previous sibling Snap element. */
		prev(): Element | null;
		/** Returns whether this element has child elements. */
		hasChildren(): boolean;
		/** Returns wrapped child elements with optional visibility/text filtering. */
		getChildren(visible?: boolean, includeText?: boolean): Element[];
		/** Removes every child element. */
		removeChildren(): this;
		/** Adds a `<use>` reference to this element. */
		addUse(reference: string | Element, x?: number, y?: number): Element;
		/** Resolves the referenced node for a `<use>` element. */
		getUseTarget(): Element | null;
		/** Associates this element with a paper wrapper. */
		setPaper(paper: Paper, force?: boolean): this;
		/** Returns whether this element behaves as a group. */
		isGroupLike(): boolean;
		/** Removes `<use>` nodes that reference this element. */
		removeUses(): this;
		/** Adds a class name to the element. */
		addClass(name: string): this;
		/** Removes a class name from the element. */
		removeClass(name: string): this;
		/** Toggles a class name, optionally forcing the state. */
		toggleClass(name: string, value?: boolean): this;
		/** Checks whether the element has the class name. */
		hasClass(name: string): boolean;
		/** Configures a clipping path. */
		attrClip(clip: Element | null): this;
		/** Converts the element and descendants into a reusable fragment. */
		toFragment(): Fragment;
		/** Converts the element to its string representation. */
		toString(): string;
		/** Converts the element to a plain object representation. */
		toJSON(): Record<string, unknown>;
		/** Returns the outer SVG markup. */
		outerSVG(): string;
		/** Returns the inner SVG markup. */
		innerSVG(): string;
		/** Serializes this node to a data URL. */
		toDataURL(): string;
		/** Applies attributes or style values using the jQuery-style alias. */
		css(name: string, value?: AttrValue): this | AttrValue;
		css(attrs: Attributes): this;
		/** Forces attribute values to be set directly on the DOM node. */
		attr_force(name: string, value?: AttrValue): this | AttrValue;
		attr_force(attrs: Attributes): this;
		/** Returns an attribute value without Snap's attribute processing. */
		getTrueAttr(name: string): AttrValue;
		/** Registers cleanup work performed when the element is removed. */
		registerRemoveFunction(callback: (element: Element) => void): this;
		/** Runs and clears registered removal callbacks. */
		cleanupAfterRemove(): this;
		/** Selects a descendant matching the CSS selector. */
		select<T extends Element = Element>(selector: string): T | null;
		/** Selects all descendants matching the CSS selector. */
		selectAll<T extends Element = Element>(selector: string): Set<T>;
		/** Applies a pattern to the element. */
		pattern(x: number, y: number, width: number, height: number): Element;
		/** Applies a marker definition to the element. */
		marker(x?: number, y?: number, width?: number, height?: number, refX?: number, refY?: number): Element;
		/** Exports the current node to a `<defs>` block. */
		toDefs(): Element;
	}

	/**
	 * Wrapper around an SVG DOM node providing the extended Snap.svg API.
	 */
	type PathPointEnding = "mid" | "end" | "start" | "start_end";
	type PathPointType = "corner" | "smooth" | "symmetric";

	interface PathPoint {
		c: Point2D;
		a?: Point2D | undefined;
		b?: Point2D | undefined;
		ending?: PathPointEnding | undefined;
		length_from_prev?: number | undefined;
		tot_length?: number | undefined;
		rel_length_from_prev?: number | undefined;
		tot_rel_length?: number | undefined;
		bezeir?: unknown;
		getType(): PathPointType | undefined;
		isCorner(): boolean;
		isSmooth(notSymmetric?: boolean): boolean;
		isSymmetric(): boolean;
		clone(): PathPoint;
		addMeasurements?(points: PathPoint[], beziers?: unknown, close?: boolean, data?: Record<string, unknown>): void;
	}

	namespace PathPoint {
		const MIDDLE: "mid";
		const END: "end";
		const START: "start";
		const START_END: "start_end";
		const CORNER: "corner";
		const SMOOTH: "smooth";
		const SYMMETRIC: "symmetric";
	}

	interface PolyBezier {
		curves: unknown[];
		length(): number;
		clone(): PolyBezier;
		[index: number]: unknown;
	}

	interface Element extends ElementLike {
		/** Animates attributes over time. */
		animate(attrs: Attributes | ((value: number) => void), duration: number, easing?: MinaEasing, callback?: (animation: MinaAnimation) => void): MinaAnimation;
		/** Stops all ongoing animations on this element. */
		stop(): this;
		/** Removes every child element. */
		clear(): this;
		/** Applies a mask to the element. */
		mask(mask: Element | null): Element;
		/** Alias for {@link addUse}, creating a `<use>` node on this element. */
		use(reference: string | Element, x?: number, y?: number): Element;
		/** Create a partner DOM node that mirrors transformations. */
		setPartner(node: SVGElement, strict?: boolean): this;
		/** Removes one or more partner nodes. */
		removePartner(type?: string, removeElements?: boolean): this;
		/** Returns whether partner nodes are attached. */
		hasPartner(): boolean;
		/** Returns partner wrappers, optionally filtered by partner type. */
		getPartners(type?: string): Element[];
		/** Applies a style map to partner nodes. */
		setPartnerStyle(style: Attributes): this;
		/** Returns whether the element is hidden. */
		isHidden(): boolean;
		/** Converts this element to a pattern definition. */
		toPattern(x: number, y: number, width: number, height: number): Element;
		/** Adds a click handler to the element. */
		addClickEvent(callback: (event: MouseEvent) => void): this;
		/** Returns animation descriptors currently acting on the element. */
		inAnim(): Array<{ anim: AnimationDescriptor; mina: MinaAnimation; curStatus: number; status(value?: number): number | MinaAnimation; stop(): void }>;
		/** Returns the path subsegment between the provided lengths. */
		getSubpath(from: number, to: number): string;
		/** Reverse the direction of the underlying geometry when applicable. */
		reverse(): this;
		/** Converts the path element to an array representation. */
		toPathArray(expandOnly?: boolean, processArc?: boolean): PathSegmentArray[];
		/** Returns the number of path segments after normalisation. */
		getNumberPathSegments(): number;
		/** Returns analytical metadata for each path point. */
		getSegmentAnalysis(): PathPoint[];
		/** Converts the element into an array of bezier descriptors. */
		toBeziers(segmented?: boolean): unknown[];
		/** Converts the element into a poly-bezier helper. */
		toPolyBezier(): PolyBezier;
		/** Compares attribute equality. */
		equal(name: string, value: AttrValue): boolean;
		/** Returns the current alignment mode relative to another element. */
		getAlign(el: Element, way?: string): string | null;
		/** Aligns the element relative to the supplied peer. */
		align(el: Element, way?: string): this;
		/** Aligns a collection of elements using the provided anchor. */
		alignAll(elements: Element | Element[] | Set<Element>, way?: string, anchorId?: string): this;
		/** Returns a DOM-safe identifier, auto-generating it when needed. */
		getId(): string;
		/** Sets the id and rewrites all references that pointed to the previous value. */
		setIdFollowRefs(id?: string, fromGroup?: Element): this;
		/** Returns the owning top-level SVG root. */
		getTopSVG(): Element;
		/** Lists elements that reference the current element via clip/mask/use. */
		getReferringToMe(inGroup?: Element): Set<Element>;
		/** Moves the element into another group while preserving its transform. */
		repositionInGroup(group: Element): this;
		/** Converts a global point into this element's local coordinate system. */
		globalToLocal(point: DOMPoint, coordTarget?: Element): DOMPoint;
		/** Converts screen coordinates (from pointer events) into SVG coordinates. */
		getCursorPoint(x: number, y: number, coordTarget?: Element): DOMPoint;
		/** Converts a CSS pixel distance into the local coordinate system. */
		getFromScreenDistance(distance: number): number;
		/** Returns the rendered width. */
		getClientWidth(skipStyle?: boolean): number;
		/** Returns the rendered height. */
		getClientHeight(skipStyle?: boolean): number;
		/** Checks whether the element intersects a rectangle. */
		isInRect(rect: Element | BoundsLike | DOMRect): boolean;
		/** Computes the centre of mass stored on the element. */
		centerOfMass(): Point2D;
		/** Returns the preferred rotation pivot. */
		centerRotation(): Point2D;
		/** Removes the element with optional cascading switches. */
		remove(skipLinked?: boolean, skipRegisteredChildren?: boolean): this;
		/** Hides the element via CSS. */
		hide(): void;
		/** Shows the element if previously hidden. */
		show(): void;
		/** Removes the element after fading it out. */
		removeSlowly(time?: number): void;
		/** Hides the element using a fade animation. */
		hideSlowly(time?: number, after?: () => void): void;
		/** Shows the element using a fade animation. */
		showSlowly(time?: number, after?: () => void): void;
		/** Flattens group contents into the parent. */
		flatten(processCss?: boolean): this;
		/** Wraps the element in an anchor tag. */
		anchorEmbed(href: string, target?: string): void;
		/** Records a change type used by external tooling. */
		recordChange(excludeAttribute?: string, toLeafs?: boolean, callback?: (el: Element) => void, ...flags: string[]): void;
		/** Reads the recorded change flags. */
		readChanges(): string[];
		/** Marks the element as local-only. */
		localOnly(reverse?: boolean): this;
		/** Returns whether the element is marked as local-only. */
		isLocal(node?: Node): boolean;
		/** Gets or sets the first point on a path-like element. */
		pathFirstPoint(): Point2D;
		pathFirstPoint(point: number | Point2D | NumberPair, y?: number): this;
		/** Converts the element to a `<path>`. */
		makePath(recursive?: boolean): this;
		/** Creates and applies a clipPath. */
		createClipPath(path: Element, id?: string): Element;
		/** Creates and applies a mask. */
		createMask(path: Element, id?: string): Element;
		/** Localises linked element identifiers. */
		linkedElementLocalise(): void;
		/** Returns the first point of the geometry. */
		getFirstPoint(useLocalTransform?: boolean): Point2D;
		/** Sets the first point of the geometry. */
		setFirstPoint(point: number | Point2D | NumberPair, y?: number): this;
		/** Returns the last point of the geometry. */
		getLastPoint(useLocalTransform?: boolean): Point2D;
		/** Returns a filtered attribute collection. */
		attrs(attributes: string[] | Attributes, inverse?: boolean): Attributes;
		/** Returns geometry-related attributes. */
		getGeometryAttr(namesOnly?: boolean): string[] | Attributes;
		/** Returns every DOM attribute. */
		getAttributes(): Attributes;
		/** Toggles pointer transparency. */
		transparentToMouse(remove?: boolean, type?: string): this;
		/** Checks path overlap against a rectangle. */
		isOverlapRect(rect: Element | BoundsLike | BBox): boolean;
		/** Tests polygon overlap against another element or point set. */
		isOverlap(el: Point2DList | Element): boolean;
		/** Enables drag-based translation. */
		move(el?: Element, moveContext?: DragContext, startContext?: DragContext, endContext?: DragContext, selection?: Element): this;
		/** Adds drag-based rotation behaviour. */
		revolve(center?: Point2D, coordTarget?: Element, moveContext?: DragContext, startContext?: DragContext, endContext?: DragContext): this;
		/** Creates a draggable clone shadow. */
		makeDraggable(dropTarget?: Element, animate?: number | Attributes | Record<string, unknown>, endEvent?: string | string[], moveEvent?: string | string[], data?: unknown, localEve?: (...args: any[]) => void, altElement?: Element, altClick?: unknown): this;
		/** Applies local scaling. */
		scale(x: number, y?: number, cx?: number, cy?: number, previous?: MatrixLike | boolean, useCache?: boolean): this;
		/** Applies a local translation. */
		translate(x: number, y: number, previous?: MatrixLike | boolean, cx?: number, cy?: number, useBBoxCache?: boolean): this;
		/** Animates a translation. */
		translateAnimate(duration: number | [number, MinaEasing], x: number, y: number, previous?: MatrixLike | boolean, cx?: number, cy?: number, useBBoxCache?: boolean, easing?: MinaEasing): MinaAnimation;
		/** Applies a translation in global coordinates. */
		translate_glob(x: number, y: number, previous?: MatrixLike | boolean, cx?: number, cy?: number, useCache?: boolean): this;
		/** Applies a rotation. */
		rotate(angle: number, cx?: number, cy?: number, previous?: MatrixLike | boolean, useCache?: boolean): this;
		/** Mirrors the element along an axis or line. */
		reflect(direction: "x" | "y" | "vertical" | "horizontal" | number | Element, cx?: number, cy?: number, previous?: MatrixLike | boolean, useCache?: boolean): this;
		/** Adds a matrix to the existing transform. */
		addTransform(matrix: MatrixLike, previous?: MatrixLike): this;
		/** Returns all descendant leaves. */
		getLeafs(includeInvisible?: boolean, accumulator?: Element[]): Element[];
		/** Returns the parent chain, optionally transforming the values. */
		getParentChain<T = Element>(callback?: (element: Element, index: number) => T, skipCurrent?: boolean, toCoord?: boolean, includeTopSvg?: boolean): T[];
		/** Returns the coordinate transform matrix. */
		getCoordMatrix(strict?: boolean, includeSelf?: boolean): Matrix;
		/** Approximate bounding box using relative coords. */
		getRealBBox(): BBox;
		/** Precise bounding box using relative coords. */
		getRealBBoxExact(): BBox;
		/** Pushes the current transform down the tree. */
		propagateTransform(excludeAttribute?: string | boolean, transform?: MatrixLike, includeGeometry?: boolean): this;
		/** Normalises nested foreignObject transforms. */
		foreignObjectNormalize(): void;
		/** Fits the element inside the provided box. */
		fitInBox(externalBBox: Element | BBox | [number, number, number, number], preserve?: boolean | "top" | "bottom" | "left" | "right", scaleDown?: boolean, matrixOnly?: boolean): this | Matrix;
		/** Scales the element until it fills the provided box. */
		fillInBox(externalBBox: Element | BBox, scaleUp?: boolean): this;
		/** Fills the element using another SVG/image. */
		fillImage(image: Element | string, fitElement?: boolean, preserveProportions?: boolean): Element;
		/** Determines winding order of the control points. */
		isClockwise(points?: Point2DList): boolean;
		/** Distance from the path to a point. */
		distanceTo(point: number | Point2D, y?: number): number | null;
		/** Mutates the inline style map. */
		setStyle(style: string | Attributes, value?: AttrValue): this;
		/** Returns inline or computed styles. */
		getStyle(properties?: string[] | Attributes): Record<string, string>;
		/** Moves style-related attributes into the style block. */
		moveAttrToStyle(recursive?: boolean, callback?: (el: Element) => void): this;
		/** Copies computed style from another element. */
		copyComStyle(source: Element): this;
		/** Returns whether the element is above another one. */
		isAbove(el: Element): boolean;
		/** Returns whether the element is below another one. */
		isBelow(el: Element): boolean;
		/** Checks parent/child relationships. */
		isParentOf(el: Element): boolean;
		/** Checks child/parent relationships. */
		isChildOf(el: Element): boolean;
		/** Finds the closest ancestor that matches a selector or predicate. */
		selectParent(selector: string | ((element: Element) => boolean), outsideSvg?: boolean): Element | null;
		/** Finds the closest ancestor including `this`. */
		closest(selector: string, outsideSvg?: boolean): Element | null;
		/** Returns the bounding box when rotated. */
		getBBoxRot(angle: number, cx?: number | Point2D, cy?: number, approx?: boolean, settings?: Partial<BBoxParameters>): BBox;
		/** Animates towards a matrix. */
		animateTransform(matrix: MatrixLike, duration: number, easing?: MinaEasing | TransformEasingSpec | ((from: Matrix, to: Matrix) => MinaEasing), afterCallback?: (el: Element) => void, easingDirectMatrix?: boolean, processor?: (matrix: Matrix | string) => Matrix | string | void): MinaAnimation;
		/** Animates a generative transform using buffered frames. */
		animateGenTransformBuffered(transformResolver: GenerativeTransformResolver, duration: number, easing?: MinaEasing, afterCallback?: (el: Element) => void): MinaAnimation | null;
		/** Animates a generative transform computing frames on the fly. */
		animateGenTransform(transformResolver: GenerativeTransformResolver, duration: number, easing?: MinaEasing, afterCallback?: (el: Element) => void): MinaAnimation | null;
		/** Animates the element along a path relative to its current transform. */
		animateOnPath(path: Element | string, duration: number, scalePath?: boolean | ((progress: number) => number), rotatePath?: boolean | number | ((progress: number, point: PointOnPath) => number), easing?: MinaEasing, afterCallback?: (el: Element) => void, duringCallback?: (progress: number, el: Element, scale?: number, angle?: number) => void): MinaAnimation;
		/** Animates the element along a path using absolute positioning. */
		animateOnPathAbsolute(path: Element | string, duration: number, scalePath?: boolean | ((progress: number) => number), rotatePath?: boolean | number | ((progress: number, point: PointOnPath) => number), easing?: MinaEasing, afterCallback?: (el: Element) => void, duringCallback?: (progress: number, el: Element, scale?: number, angle?: number) => void): MinaAnimation;
		/** Quick jiggle animation. */
		jiggle(zoomFactor?: number): void;
		/** Iterates over descendants (depth-first). */
		forEach(callback: (element: Element) => void, includeRoot?: boolean): void;
		/** Creates a group positioned after the current element. */
		g_a(...items: Array<Element | Set<Element> | null | undefined>): Set<Element>;
		/** Wraps the element in a new group. */
		group(attr?: Attributes): Element;
		/** Returns whether the geometry approximates an ellipse. */
		isElliptical(path?: Element | string | boolean, save?: boolean, numTests?: number, error?: number): boolean | { x: number; y: number; rx: number; ry: number; angle: number } | false;
		/** Returns whether the geometry approximates a rectangle. */
		isRectangular(path?: Element | string | boolean, save?: boolean): false | NumberPair[];
		/** Applies a cursor style. */
		setCursor(cursorStyle: string, applyToChildren?: boolean, classPrefix?: string): this;
		/** Estimates the dominant line direction. */
		getDirectionLine(sample?: number, regressor?: (points: NumberPair[]) => Record<string, number>, regCoefs?: [string, string]): [number, number] | null;
		/** Compensates element scale based on zoom. */
		correctScale(centerX?: number, centerY?: number, zoom?: number): this;
		/** Enables drag-to-select behaviour. */
		regionSelect(options?: RegionSelectOptions, targetGroup?: Element, rectStyle?: Attributes, endEvent?: string | string[], moveEvent?: string | string[], sendClick?: boolean): this;
		/** Adds hover messages routed through eve. */
		addMessage(message: string, eve: (...args: any[]) => void, inEvent?: string, outEvent?: string): void;
		/** Removes message handlers added via {@link addMessage}. */
		removeMessage(): void;
		/** Serialises a node into a standalone SVG document. */
		svgEncapsulate(element: Element, width: number, height: number, inner?: boolean, x?: number, y?: number, viewWidth?: number, viewHeight?: number, defs?: Element): string;
		/** Serialises a node into an SVG using its bounding box. */
		svgEncapsulateBox(element: Element, border?: number, width?: number, height?: number, bbox?: BBox, defs?: Element): string;
		/** Rasterises the element via an offscreen canvas. */
		getBitmap(width?: number | [number, number, number?, number?], border?: number, defs?: Element, callback?: (data: ImageData | string | null) => void, base64?: boolean): void;
		/** Creates a canvas overlay aligned to the element. */
		getCanvasOverly(scale?: number | [number, number], widthPx?: number, heightPx?: number): CanvasOverlay;
		/** Rasterises the element into an `<image>`. */
		rasterize(defs?: Element, scale?: number, border?: number | string, remove?: boolean): Promise<Element>;
		/** Adds a warp definition to the element. */
		addWarp(generator: (...args: any[]) => any, region?: Element, id?: string, border?: number, options?: Record<string, unknown>): Element;
		/** Removes a warp definition by id. */
		removeWarp(id?: string): void;
		/** Draws a circle on the current element's paper. */
		circle(x: number, y: number, radius: number, attributes?: Attributes): Element;
		/** Creates an anchor element on the current element's paper. */
		a(href?: string, target?: string): Element;
		/** Creates a clipPath element on the current element's paper. */
		clipPath(first?: Attributes | Element): Element;
		/** Creates a foreignObject on the current element's paper. */
		foreignObject(x: number | Attributes, y?: number, width?: number | string, height?: number | string, html?: string): Element;
		/** Creates and inserts a text path using a registered font. */
		textPath(x: number, y: number, text: string, fontName: string, fontSize?: number, options?: Record<string, unknown>): Element;
		/** Registers an interaction handler. */
		addInteractionEvent(type: string, action: unknown, otherParams?: Record<string, unknown>, replace?: boolean, localEve?: (...args: any[]) => void): this;
		/** Adds a click interaction handler. */
		addClickEvent(action: unknown, otherParams?: Record<string, unknown>, replace?: boolean, localEve?: (...args: any[]) => void): this;
		/** Adds a press interaction handler. */
		addPressEvent(action: unknown, otherParams?: Record<string, unknown>, replace?: boolean, localEve?: (...args: any[]) => void): this;
		/** Adds a hold interaction handler. */
		addHoldEvent(action: unknown, otherParams?: Record<string, unknown>, replace?: boolean, localEve?: (...args: any[]) => void): this;
		/** Adds a long-press interaction handler. */
		addLongpressEvent(action: unknown, otherParams?: Record<string, unknown>, replace?: boolean, localEve?: (...args: any[]) => void): this;
		/** Adds a pointer-search path to this element. */
		searchPathAdd(paperOrSvg: Element): this;
		/** Removes a pointer-search path from this element. */
		searchPathRemove(paperOrSvg: Element): this;
		/** Enables rotation through drag interaction. */
		rotDrag(element?: Element, moveContext?: DragContext, startContext?: DragContext, endContext?: DragContext): this;
		/** Transforms ellipse geometry using a matrix. */
		ellipseTransform(matrix: MatrixLike): this;
	}

	/**
	 * Wrapper around an `<svg>` root providing element creation helpers and utilities.
	 */
	interface Paper extends ElementLike {
		/** Adds child elements to the paper. */
		add(element: Element | Element[] | Set<Element>, index?: number): this;
		/** Draws a rectangle on the paper. */
		rect(x: number, y: number, width: number, height: number, rx?: number | NumberPair, ry?: number, attr?: Attributes): Element;
		/** Draws a circle. */
		circle(cx: number, cy: number, r: number, attr?: Attributes): Element;
		/** Draws an ellipse. */
		ellipse(cx: number, cy: number, rx: number, ry: number, attr?: Attributes): Element;
		/** Draws a line. */
		line(x1: number, y1: number, x2: number, y2: number, attr?: Attributes): Element;
		/** Draws a polyline. */
		polyline(points: Array<number> | string, attr?: Attributes): Element;
		/** Draws a polygon. */
		polygon(points: Array<number> | string, attr?: Attributes): Element;
		/** Draws a path. */
		path(path?: string | Array<string | number>, attr?: Attributes): Element;
		/** Renders text. */
		text(x: number, y: number, text: string | string[], attr?: Attributes): Element;
		/** Wraps the paper's current SVG element in a new group. */
		group(attr?: Attributes): Element;
		/** Creates a new `<g>` element and optionally adds the supplied elements. */
		g(...items: Array<Element | Set<Element> | null | undefined>): Element;
		/** Creates a new `<g>` element, adds elements, and applies trailing attributes. */
		g(...items: [...Array<Element | Set<Element> | null | undefined>, Attributes]): Element;
		/** Creates an image element. */
		image(src: string | Attributes, x?: number, y?: number, width?: number, height?: number, attr?: Attributes): Element;
		/** Uses an existing definition. */
		use(id: string | Element | Attributes, attr?: Attributes): Element;
		/** Creates an arbitrary SVG element. */
		el(name: string, attr?: Attributes): Element;
		/** Creates a nested SVG element. */
		svg(x?: number | Attributes, y?: number, width?: number | string, height?: number | string, viewBoxX?: number, viewBoxY?: number, viewBoxWidth?: number, viewBoxHeight?: number): Element;
		/** Creates an SVG symbol. */
		symbol(viewBoxX?: number, viewBoxY?: number, viewBoxWidth?: number, viewBoxHeight?: number, attr?: Attributes): Element;
		/** Creates a pattern using the core paper API. */
		ptrn(x?: number | Attributes, y?: number, width?: number, height?: number, viewBoxX?: number, viewBoxY?: number, viewBoxWidth?: number, viewBoxHeight?: number, attr?: Attributes): Element;
		/** Creates a filter from SVG filter markup. */
		filter(markup: string, local?: boolean): Element;
		/** Creates a reusable fragment. */
		fragment(...nodes: Array<string | Element | Element[] | null | undefined>): Fragment;
		/** Creates a textPath element linked to path data or an existing path. */
		textPath(path: string | Element | PathSegmentArray | Attributes, text?: string | string[], attr?: Attributes): Element;
		/** Creates a font-backed text path. */
		textPath(x: number, y: number, text: string, fontName: string, fontSize?: number, options?: Record<string, unknown>): Element;
		/** Returns the `<defs>` element, creating it when missing. */
		defs(): Element;
		/** Creates a linear gradient definition. */
		gradient(gradient: string): Element;
		/** Creates a linear gradient from coordinates. */
		gradientLinear(x1: number, y1: number, x2: number, y2: number): Element;
		/** Creates a radial gradient from a centre and radius. */
		gradientRadial(cx: number, cy: number, radius: number, fx?: number, fy?: number): Element;
		/** Creates a pattern definition. */
		pattern(x: number, y: number, width: number, height: number, vbx?: number, vby?: number, vbw?: number, vbh?: number): Element;
		/** Creates a mask definition. */
		mask(...elements: Array<Element | Attributes>): Element;
		/** Creates a marker definition. */
		marker(x: number, y: number, width: number, height: number, refX?: number, refY?: number): Element;
		/** Clears the paper contents. */
		clear(): void;
		/** Returns the attribute value. */
		attr(name: string): AttrValue;
		/** Sets one attribute. */
		attr(name: string, value: AttrValue): this;
		/** Sets multiple attributes at once. */
		attr(attrs: Attributes): this;
		/** Registers a lazily executed extension. */
		addExtension(name: string, processor: (root: Element) => void): void;
		/** Applies all registered extensions to the supplied root. */
		processExtensions(root: Element): void;
		/** Creates a clipPath element. */
		clipPath(first?: Attributes | Element): Element;
		/** Creates an anchor element. */
		a(href?: string, target?: string): Element;
		/** Wraps content with a clickable rectangle. */
		button(el: Element | string, border?: number, action?: (event: MouseEvent) => void, backgroundStyle?: Attributes | string, style?: Attributes | string): Element;
		/** Creates a foreignObject element. */
		foreignObject(x: number | Attributes, y?: number, width?: number | string, height?: number | string, html?: string): Element;
		/** Creates a managed foreignObject with an accessible inner div. */
		htmlInsert(x: number, y: number, width: number | string, height: number | string, html?: string | Element | Element[], style?: Attributes | string): Element & { div?: Element };
		/** Embeds a nested Snap instance via foreignObject. */
		embeddedSVG(x: number, y: number, width: number, height: number, element?: Element | Element[], viewBox?: Element | [number, number, number, number]): Element & { embeddedSvg?: Paper };
		/** Creates a canvas rendered inside a foreignObject. */
		canvas(x: number, y: number, width: number, height: number, id?: string): Element & { canvas: HTMLCanvasElement };
		/** Creates a lightweight HTML input box. */
		textInputBox(id: string, x: number, y: number, width: number, height: number): Element;
		/** Draws an SVG grid made of line elements. */
		grid(x: number, y: number, width: number, height: number, columns: number | Attributes | Element, rows?: number, strokeWidth?: number, style?: Attributes, elements?: boolean): Element;
		/** Draws a rectangular cell grid. */
		grid(width: number, height: number, rows: number, cols: number, style?: Attributes | ((rect: Element, col: number, row: number) => void), id?: string, group?: Element): Element;
		/** Converts a CSS pixel distance into paper coordinates. */
		getFromScreenDistance(distance: number): number;
		/** Measures text by rendering it temporarily. */
		measureText(text: string, fontStyle?: Attributes, group?: Element): BBox;
		/** Renders multiline text with tspans. */
		multilineText(x: number, y: number, text: string | string[], attr?: Attributes, linespace?: number, first_tab?: number): Element;
		/** Creates a nine-slice border graphic. */
		borderImage(image: Element | string, border?: number, x?: number, y?: number, width?: number, height?: number, color?: string | Attributes): Element;
		/** Builds a circle from a centre and another point. */
		circleCentPoint(x1: number | Point2D, y1: number | Point2D, x2: number, y2: number): Element;
		/** Builds a circle from the endpoints of a diameter. */
		circleTwoPoints(x1: number | Point2D, y1: number | Point2D, x2: number, y2: number): Element;
		/** Builds a circle that passes through three points. */
		circleThreePoints(x1: number | Point2D, y1: number | Point2D, x2: number | Point2D, y2: number, x3: number, y3: number): Element | null;
		/** Construct an ellipse from the general quadratic equation. */
		ellipseFromEquation(A: number, B: number, C: number, D: number, E: number, F?: number | boolean, propertiesOnly?: boolean): Element | { x: number; y: number; rx: number; ry: number; angle: number } | null;
		/** Slices an annulus into segments. */
		diskSegments(numSegments: number, angle?: number, startAngle?: number, innerRadius?: number, outerRadius?: number, style?: Attributes | Attributes[] | ((el: Element, group: Element, index: number, innerRadius: number, outerRadius: number, angleStep: number, angle: number, points: NumberPair[]) => void), id?: string, group?: Element, className?: string): Element;
		/** Creates a donut-shaped path. */
		disk(cx: number, cy: number, outerRadius: number, innerRadius: number): Element;
		/** Places repeated symbols along an arc. */
		arcFan(radius: number, angle: number, step: number, symbol: Element | { type: string; [key: string]: any }, style?: Attributes | Attributes[] | ((el: Element, group: Element, index: number, angle: number, point: Point2D) => void), id?: string, group?: Element): Element;
		/** Draws a zigzag polyline. */
		zigzag(p1: Point2D, p2OrWidth: Point2D | number, period: number, amplitude: number, reverse?: boolean): Element;
		/** Creates a visual point marker and optional label. */
		point(group: Element, x: number, y: number, color?: string | number, size?: number, label?: string | null, labelStyle?: Attributes): Element;
		/** Creates an SVG attribute animation node. */
		animate(attrs: Attributes, target?: Element): Element;
		/** Creates an SVG attribute animation node from positional values. */
		animate(attributeName?: string, from?: string | number, to?: string | number, dur?: string | number, begin?: string | number, repeatCount?: string | number, fill?: string, calcMode?: string, values?: string | string[] | number[], keyTimes?: string | number[], keySplines?: string | number[], by?: string | number, attr?: Attributes, target?: Element): Element;
		/** Alias for {@link animate}. */
		animate_el(attrs: Attributes, target?: Element): Element;
		/** Alias for positional {@link animate}. */
		animate_el(attributeName?: string, from?: string | number, to?: string | number, dur?: string | number, begin?: string | number, repeatCount?: string | number, fill?: string, calcMode?: string, values?: string | string[] | number[], keyTimes?: string | number[], keySplines?: string | number[], by?: string | number, attr?: Attributes, target?: Element): Element;
		/** Creates an SVG transform animation node. */
		animateTransform(attrs: Attributes, target?: Element): Element;
		/** Creates an SVG transform animation node from positional values. */
		animateTransform(type?: string, from?: string | number, to?: string | number, dur?: string | number, begin?: string | number, repeatCount?: string | number, fill?: string, calcMode?: string, values?: string | string[] | number[], keyTimes?: string | number[], keySplines?: string | number[], by?: string | number, additive?: string, accumulate?: string, attr?: Attributes, target?: Element): Element;
		/** Alias for {@link animateTransform}. */
		animateTransform_el(attrs: Attributes, target?: Element): Element;
		/** Alias for positional {@link animateTransform}. */
		animateTransform_el(type?: string, from?: string | number, to?: string | number, dur?: string | number, begin?: string | number, repeatCount?: string | number, fill?: string, calcMode?: string, values?: string | string[] | number[], keyTimes?: string | number[], keySplines?: string | number[], by?: string | number, additive?: string, accumulate?: string, attr?: Attributes, target?: Element): Element;
		/** Creates an SVG motion animation node. */
		animateMotion(attrs: Attributes, target?: Element): Element;
		/** Creates an SVG motion animation node from a path and positional values. */
		animateMotion(path: PathInput, dur?: string | number, begin?: string | number, repeatCount?: string | number, rotate?: string | number, calcMode?: string, keyPoints?: string | number[], keyTimes?: string | number[], keySplines?: string | number[], attr?: Attributes, target?: Element): Element;
		/** Creates an `<mpath>` node for an SVG motion animation. */
		mpath(path: PathInput | Attributes, attr?: Attributes): Element;
		/** Returns the paper as SVG markup. */
		toString(): string;
		/** Serializes the paper to a data URL. */
		toDataURL(): string;
		/** Removes all paper content. */
		clear(): this;
		/** Alias for {@link g}; creates a new `<g>` element. */
		def_group(...items: Array<Element | Set<Element> | null | undefined>): Element;
		/** Alias for {@link g} with trailing group attributes. */
		def_group(...items: [...Array<Element | Set<Element> | null | undefined>, Attributes]): Element;
		/** Creates a text path from a registered font. */
		textPath(x: number, y: number, text: string, fontName: string, fontSize?: number, options?: Record<string, unknown>): Element;
	}

	/**
	 * Array-like collection of elements with convenience methods mirroring
	 * `Array<T>` plus grouped DOM helpers.
	 */
	interface Set<T extends Element = Element> {
		/** Number of elements in the collection. */
		length: number;
		/** Indexed element access. */
		[index: number]: T;
		/** Identifies this collection as a Snap set. */
		readonly type: "set";
		/** Adds elements to the set. */
		push(...items: T[]): this;
		/** Removes the last element and returns it. */
		pop(): T | undefined;
		/** Iterates over members. */
		forEach(callback: (element: T, index: number) => void | false, scope?: unknown): this;
		/** Animates every element with the supplied attributes. */
		animate(attrs: Attributes, duration: number, easing?: MinaEasing, callback?: (animation: MinaAnimation) => void): this;
		/** Applies attribute changes to all elements. */
		attr(attrs: Attributes): this;
		/** Removes all elements from the set. */
		clear(): void;
		/** Removes the specified element from the set. */
		exclude(element: T): boolean;
		/** Returns the first element matching the predicate. */
		splice(start: number, deleteCount?: number, ...insertions: T[]): Set<T>;
		/** Map helper returning an array of results. */
		map<U>(callback: (element: T, index: number, values: T[]) => U, scope?: unknown): U[];
		/** Filters members and returns a regular array. */
		filter(callback: (element: T, index: number, values: T[]) => unknown, scope?: unknown): T[];
		/** Returns whether the set contains the value. */
		includes(value: T, fromIndex?: number): boolean;
		/** Returns a copy of the set values as an array. */
		values(): T[];
		/** Returns a set containing deep clones of all members. */
		clone(): Set<T>;
		/** Removes all members from the DOM and this set. */
		remove(): this;
		/** Binds a set attribute to a callback or another element. */
		bind(attribute: string, callbackOrElement: ((value: AttrValue) => void) | Element, targetAttribute?: string): this;
		/** Inserts all members after the supplied element. */
		insertAfter(element: Element): this;
		/** Returns the union of member bounding boxes. */
		getBBox(): BBox | undefined;
		/** Returns a descriptive string. */
		toString(): string;
	}

	/** Lightweight wrapper around a `DocumentFragment`. */
	interface Fragment {
		/** Root DOM fragment. */
		readonly node: DocumentFragment;
		/** Retains this detached fragment against Snap's cleanup. */
		retain(): this;
		/** Releases this fragment from Snap's retained-fragment registry. */
		release(): this;
		/** Select a descendant within the fragment. */
		select<T extends Element = Element>(selector: string): T | null;
		/** Select descendants within the fragment. */
		selectAll<T extends Element = Element>(selector: string): Set<T>;
	}

	// Core factory -------------------------------------------------------------

	}

	/**
	 * Main entry point that creates a drawing surface, wraps existing SVG
	 * content, or returns utility objects depending on the argument type.
	 */
	declare function Snap(width?: number | string | SVGElement | Snap.Element[], height?: number | string | Snap.Attributes | null): Snap.Paper | Snap.Element | Snap.Set<Snap.Element> | null;

	declare namespace Snap {
		type SnapFunction = typeof Snap;
		/** String representation of the library version. */
		const version: string;
		/** Sentinel constant that forces insertion after the current node. */
		const FORCE_AFTER: "__force_after";
		/** Helper namespace containing rarely used internals. */
		const _: Record<string, unknown> & {
			/** Exposes the global references used by the library. */
			glob: { win: Window; doc: Document };
			/** Generic cache helper. */
			cacher<T extends (...args: any[]) => any>(fn: T, scope?: unknown, post?: (value: ReturnType<T>) => ReturnType<T>): T;
		};
		/** Returns the global window instance. */
		function window(): Window;
		/** Returns the global document, optionally resolving an owning paper. */
		function document(paper?: boolean): Document | Paper;
		function document(element: Node | ElementLike, paper?: boolean): Document | Paper;
		/** Overrides the window used by the library. */
		function setWindow(newWindow: Window): void;
		/** Overrides the document used by the library. */
		function setDocument(newDocument: Document | ShadowRoot, forceTop?: boolean): void;
		/** XML namespace URLs used when creating SVG and HTML nodes. */
		const xmlns: XMLNamespaces;
		/** Returns the library's string representation. */
		function toString(): string;
		/** Indicates whether data event handling is enabled. */
		const _dataEvents: boolean;
		/** Compare the DOM position between two nodes or Snap elements. */
		function _compareDomPosition(a: Element | Node, b: Element | Node): number;
		/** Comparator that orders elements by visual stacking. */
		const positionComparator: ((a: Element, b: Element) => number) & { inverse(a: Element, b: Element): number };
		/** Returns the prototype object registered under the supplied name. */
		function getProto(name: "element" | "paper" | "fragment" | string): any;
		/** Enables or disables data event handling. */
		function enableDataEvents(off?: boolean): void;
		/** Formats a string using `{}` tokens. */
		function format(template: string, data: any): string;
		/** Converts degrees to radians. */
		function rad(deg: number): number;
		/** Converts radians to degrees. */
		function deg(rad: number): number;
		/** Calculates the sine of an angle specified in degrees. */
		function sin(angle: number): number;
		/** Calculates the cosine of an angle specified in degrees. */
		function cos(angle: number): number;
		/** Calculates the tangent of an angle specified in degrees. */
		function tan(angle: number): number;
		/** Calculates the cotangent of an angle specified in degrees. */
		function cot(angle: number): number;
		/** Equivalent to `Math.asin()` returning degrees. */
		function asin(value: number): number;
		/** Equivalent to `Math.acos()` returning degrees. */
		function acos(value: number): number;
		/** Equivalent to `Math.atan()` returning degrees. */
		function atan(value: number): number;
		/** Equivalent to `Math.atan2()` returning degrees. */
		function atan2(y: number, x?: number): number;
		/** Converts polar coordinates specified in radians to cartesian coordinates. */
		function fromPolar(r: number, phi: number): Point2D;
		/** Converts a cartesian vector to polar coordinates in radians. */
		function toPolar(x: number, y: number): PolarCoordinates;
		/** Converts polar coordinates specified in degrees to cartesian coordinates. */
		function fromPolar_deg(r: number, phi: number): Point2D;
		/** Converts a cartesian vector to polar coordinates in degrees. */
		function toPolar_deg(x: number, y: number): PolarCoordinates;
		/** Converts spherical coordinates (radians) to Cartesian coordinates. */
		function fromSpherical(r: number, theta: number, phi: number): Point3D;
		/** Converts Cartesian coordinates to spherical coordinates (radians). */
		function toSpherical(x: number, y: number, z: number): { r: number; theta: number; phi: number };
		/** Converts spherical coordinates (degrees) to Cartesian coordinates. */
		function fromSpherical_deg(r: number, theta: number, phi: number): Point3D;
		/** Converts Cartesian coordinates to spherical coordinates (degrees). */
		function toSpherical_deg(x: number, y: number, z: number): { r: number; theta: number; phi: number };
		/** Returns a unit-length vector pointing in the same direction. */
		function normalize(vector: VectorInput): Point2D;
		/** Returns a unit-length 3D vector. */
		function normalize(vector: Vector3Input): Point3D;
		/** Returns a unit-length vector pointing in the same direction. */
		function normalize(x: number, y: number): Point2D;
		/** Returns a unit-length 3D vector. */
		function normalize(x: number, y: number, z: number): Point3D;
		/** Returns an orthogonal vector, optionally using the left-hand normal. */
		function orthogonal(vector: VectorInput, y?: number, lefthand?: boolean): Point2D;
		/** Returns an orthogonal vector, optionally using the left-hand normal. */
		function orthogonal(x: number, y: number, lefthand?: boolean): Point2D;
		/** Returns an orthogonal 3D vector, optionally relative to a reference vector. */
		function orthogonal(vector: Vector3Input, y: number | undefined, z: number, lefthand?: boolean, reference?: Point3D): Point3D;
		/** Returns an orthogonal 3D vector. */
		function orthogonal(x: number, y: number, z: number, lefthand?: boolean, reference?: Point3D): Point3D;
		/** Returns an angle between two or three points. */
		function angle(x1: number | Point2D, y1: number | Point2D, x2?: number, y2?: number, x3?: number, y3?: number): number;
		/** Returns distance between two points. */
		function len(x1: number | Point2D, y1: number | Point2D, x2?: number, y2?: number): number;
		/** Returns squared distance between two points. */
		function len2(x1: number | Point2D, y1: number | Point2D, x2?: number, y2?: number): number;
		/** Adds two vectors. */
		function v_add(a: VectorInput, b: VectorInput): Point2D;
		/** Adds two vectors. */
		function v_add(x1: number, y1: number, x2: number, y2: number): Point2D;
		/** Adds a 2D vector and scalar coordinates. */
		function v_add(a: VectorInput, x: number, y: number): Point2D;
		/** Adds a 3D vector and scalar coordinates. */
		function v_add(a: Vector3Input, x: number, y: number, z: number): Point3D;
		/** Subtracts one vector from another. */
		function v_subtract(a: VectorInput, b: VectorInput): Point2D;
		/** Subtracts one vector from another. */
		function v_subtract(x1: number, y1: number, x2: number, y2: number): Point2D;
		/** Subtracts scalar coordinates from a 2D vector. */
		function v_subtract(a: VectorInput, x: number, y: number): Point2D;
		/** Subtracts scalar coordinates from a 3D vector. */
		function v_subtract(a: Vector3Input, x: number, y: number, z: number): Point3D;
		/** Returns the midpoint between two vectors. */
		function v_mid(a: VectorInput, b: VectorInput): Point2D;
		/** Returns the midpoint between two vectors. */
		function v_mid(x1: number, y1: number, x2: number, y2: number): Point2D;
		/** Returns the midpoint between a 2D vector and scalar coordinates. */
		function v_mid(a: VectorInput, x: number, y: number): Point2D;
		/** Returns the midpoint between a 3D vector and scalar coordinates. */
		function v_mid(a: Vector3Input, x: number, y: number, z: number): Point3D;
		/** Adds two 3D vectors. */
		function v_add(a: Vector3Input, b: Vector3Input): Point3D;
		/** Adds two 3D vectors. */
		function v_add(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Point3D;
		/** Subtracts one 3D vector from another. */
		function v_subtract(a: Vector3Input, b: Vector3Input): Point3D;
		/** Subtracts one 3D vector from another. */
		function v_subtract(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Point3D;
		/** Returns the midpoint between two 3D vectors. */
		function v_mid(a: Vector3Input, b: Vector3Input): Point3D;
		/** Returns the midpoint between two 3D vectors. */
		function v_mid(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Point3D;
		/** Returns the dot product between two vectors. */
		function dot(a: VectorInput, b: VectorInput): number;
		/** Returns the dot product between two vectors. */
		function dot(x1: number, y1: number, x2: number, y2: number): number;
		/** Returns the dot product between 3D vectors. */
		function dot(a: Vector3Input, b: Vector3Input): number;
		/** Returns the dot product between a 2D vector and scalar coordinates. */
		function dot(a: VectorInput, x: number, y: number): number;
		/** Returns the dot product between 3D vectors. */
		function dot(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
		/** Returns the dot product between a vector and scalar coordinates. */
		function dot(a: Vector3Input, x: number, y: number, z?: number): number;
		/** Returns the 2D cross product (scalar) between two vectors. */
		function cross(a: VectorInput, b: VectorInput): number;
		/** Returns the 2D cross product (scalar) between two vectors. */
		function cross(x1: number, y1: number, x2: number, y2: number): number;
		/** Returns a 3D vector cross product. */
		function cross(a: Vector3Input, b: Vector3Input): Point3D;
		/** Returns a 3D vector cross product. */
		function cross(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Point3D;
		/** Projects one vector onto another. */
		function project(a: VectorInput, b: VectorInput): Point2D;
		/** Projects one vector onto another. */
		function project(x1: number, y1: number, x2: number, y2: number): Point2D;
		/** Projects a 3D vector onto another 3D vector. */
		function project(a: Vector3Input, b: Vector3Input): Point3D;
		/** Projects a 2D vector onto scalar-coordinate components. */
		function project(a: VectorInput, x: number, y: number): Point2D;
		/** Projects a 3D vector onto another 3D vector. */
		function project(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Point3D;
		/** Projects a vector onto scalar-coordinate components. */
		function project(a: Vector3Input, x: number, y: number, z?: number): Point2D | Point3D;
		/** Returns the zero vector. */
		function zero(): Point2D;
		/** Returns the zero vector, optionally with a Z coordinate. */
		function zero(is3D: boolean): Point2D | Point3D;
		/** Returns a 2D vector multiplied by a scalar. */
		function v_c_mult(scalar: number, vector: VectorInput): Point2D;
		/** Returns a 3D vector multiplied by a scalar. */
		function v_c_mult(scalar: number, vector: Vector3Input): Point3D;
		/** Returns a 2D vector multiplied by a scalar. */
		function v_c_mult(scalar: number, x: number, y: number): Point2D;
		/** Returns a 3D vector multiplied by a scalar. */
		function v_c_mult(scalar: number, x: number, y: number, z: number): Point3D;
		/** Linearly interpolates between two points or vectors. */
		function v_lerp(from: VectorInput, to: VectorInput, progress: number): Point2D;
		/** Linearly interpolates between two 3D vectors. */
		function v_lerp(from: Vector3Input, to: Vector3Input, progress: number): Point3D;
		/** Linearly interpolates between scalar-coordinate vectors. */
		function v_lerp(x1: number, y1: number, x2: number, y2: number, progress: number): Point2D;
		/** Linearly interpolates between scalar-coordinate 3D vectors. */
		function v_lerp(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, progress: number): Point3D;
		/** Linearly interpolates between a vector and scalar coordinates. */
		function v_lerp(from: Vector3Input, x: number, y: number, z: number, progress: number): Point2D | Point3D;
		/** Reflects one 2D vector across another. */
		function v_reflect(vector: VectorInput, normal: VectorInput): Point2D;
		/** Reflects a 2D vector across scalar normal coordinates. */
		function v_reflect(vector: VectorInput, normalX: number, normalY: number): Point2D;
		/** Reflects one 3D vector across another. */
		function v_reflect(vector: Vector3Input, normal: Vector3Input): Point3D;
		/** Reflects a 3D vector across scalar normal coordinates. */
		function v_reflect(vector: Vector3Input, normalX: number, normalY: number, normalZ: number): Point3D;
		/** Reflects a 2D vector across scalar normal coordinates. */
		function v_reflect(x: number, y: number, normalX: number, normalY: number): Point2D;
		/** Reflects a 3D vector across scalar normal coordinates. */
		function v_reflect(x: number, y: number, z: number, normalX: number, normalY: number, normalZ: number): Point3D;
		/** Rotates a vector around a 3D axis. */
		function v_rotate3D(vector: Point3D, axis: Point3D, angle: number): Point3D;
		/** Clamps a 2D vector's magnitude. */
		function v_clamp(vector: VectorInput, maxLength: number): Point2D;
		/** Clamps a 3D vector's magnitude. */
		function v_clamp(vector: Vector3Input, maxLength: number): Point3D;
		/** Clamps a 2D vector represented by coordinates. */
		function v_clamp(x: number, y: number, maxLength: number): Point2D;
		/** Clamps a 3D vector represented by coordinates. */
		function v_clamp(x: number, y: number, z: number, maxLength: number): Point3D;
		/** Returns the angle between 2D vectors in radians. */
		function v_angle(a: VectorInput, b: VectorInput): number;
		/** Returns the angle between scalar-coordinate 2D vectors in radians. */
		function v_angle(x1: number, y1: number, x2: number, y2: number): number;
		/** Returns the angle between 3D vectors in radians. */
		function v_angle(a: Vector3Input, b: Vector3Input): number;
		/** Returns the angle between a 2D vector and scalar coordinates in radians. */
		function v_angle(a: VectorInput, x: number, y: number): number;
		/** Returns the angle between scalar-coordinate 3D vectors in radians. */
		function v_angle(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
		/** Returns the angle between a vector and scalar-coordinate components in radians. */
		function v_angle(a: Vector3Input, x: number, y: number, z?: number): number;
		/** Returns the signed angle between 2D vectors. */
		function v_angle_signed(a: VectorInput, b: VectorInput): number;
		/** Vector pointing from a point to the closest point on a line segment. */
		function vectorPointToLine(p: VectorInput, lp1: VectorInput, lp2: VectorInput, normalize?: boolean, sqError?: number): Point2D;
		/** Checks whether an angle lies between two reference angles. */
		function angle_between(a1: number, a2: number, target: number): boolean;
		/** Normalises an angle in degrees or radians. */
		function angle_normalize(angle: number, betweenNegPos?: boolean, radians?: boolean): number;
		/** Returns a safe distance from a point to an element bounding box. */
		function getSafeDistance(point: Point2D, element: Element, top?: boolean): number;
		/** Returns closest point on a path to the given coordinates. */
		function closestPoint(path: Element, x: number, y: number): { x: number; y: number; length: number; distance: number };
		/** Returns the closest point in a point cloud to the supplied coordinates. */
		function closest(x: number, y: number, X: Point2DList | number[], Y?: number[]): Point2D & { len: number } | undefined;
		/** Finds the intersection of two polygons. */
		const polygons: PolygonNamespace;
		/** Builds a concave hull around points. */
		function hull(points: PointCollection, concavity?: number, format?: string): PointCollection;
		/** Builds a convex hull around points. */
		function convexHull(points: PointCollection, format?: string): PointCollection;
		/** Computes Voronoi data for a point collection. */
		function voronoi(points: PointCollection): unknown;
		/** Finds the closest pair of points. */
		function closestPair(points: PointCollection): unknown;
		/** Creates a k-d tree for point lookup. */
		function kdTree(points: PointCollection, dimensions?: string[]): unknown;
		/** Creates an X-sorted k-d tree. */
		function kdTreeX(points: PointCollection): unknown;
		/** Creates a Y-sorted k-d tree. */
		function kdTreeY(points: PointCollection): unknown;
		/** Creates a binary heap scored by the supplied function. */
		function binaryHeap<T>(score: (value: T) => number): unknown;
		/** Generates random 2D points within a rectangle. */
		function randomPoints(count: number, width: number, height: number): Point2DList;
		/** Finds pairs of nearby points across two collections. */
		function nearPairs(first: PointCollection, second: PointCollection): unknown;
		/** Touch and pointer event support flags. */
		const supportsTouch: boolean;
		const poinertSupport: boolean;
		/** Gesture defaults and gesture names exported by the gesture extension. */
		const gestureDefaults: Record<string, unknown>;
		const gestureNames: string[];
		/** Replacement for `typeof` that recognises Snap specific abstractions. */
		function is(value: unknown, type: string): boolean;
		/** Registers a constructor under the supplied type name. */
		function registerClass(type: string, ctor: any): void;
		/** Alias for {@link registerClass}. */
		function registerType(type: string, ctor: any): void;
		/** Retrieves a constructor registered with {@link registerClass}. */
		function getClass<T = unknown>(type: string): T;
		/** Snaps a value to a discrete grid. */
		function snapTo(values: number[] | number, value: number, tolerance?: number): number;
		/** Parses a colour string into RGB components. */
		function getRGB(color: string): RGBColor;
		/** Factory returning a new matrix instance. */
		function matrix(a?: number | MatrixLike, b?: number, c?: number, d?: number, e?: number, f?: number): Matrix;
		/** Computes the change-of-basis matrix between two groups. */
		function groupToGroupChangeOfBase(from: Element, to: Element): Matrix;
		/** Tests whether two concave polygons intersect. */
		function polygonsIntersectConcave(a: Point2DList, b: Point2DList): boolean;
		/** Expands a polygon by offsetting each vertex outward. */
		function polygonExpand(points: Point2DList, distance: number): Point2DList;
		/** Performs asynchronous resource loading. */
		function load(url: ResourceSpecifier, callback: (fragment: Fragment, raw?: string) => void, scope?: unknown, data?: string, filter?: string | ((fragment: Fragment) => void), failCallback?: (error: unknown) => void, failScope?: unknown, eve?: unknown): void;
		/** Lightweight AJAX helper. */
		function ajax(url: string | [string, unknown], callback: (req: XMLHttpRequest) => void, scope?: unknown, failCallback?: (req: XMLHttpRequest) => void): void;
		/** Lightweight AJAX helper. */
		function ajax(url: string | [string, unknown], postData: unknown, callback: (req: XMLHttpRequest) => void, scope?: unknown, failCallback?: (req: XMLHttpRequest) => void): void;
		/** Parses SVG markup into a fragment. */
		function parse(markup: string, filter?: string | ((fragment: Fragment) => void)): Fragment;
		/** Converts a compact JSON representation into SVG/XML markup. */
		function jsonToSvg(json: unknown, decrypt?: (map: Record<string, string>) => Record<string, string>, map?: Record<string, string>, system?: AttributeKeyConfiguration): string;
		/** Creates a fragment from mixed nodes. */
		function fragment(...nodes: Array<string | Element | Element[] | Node | null | undefined>): Fragment;
		/** Converts between CSS style string and object representations. */
		function convertStyleFormat(style: string): Record<string, string>;
		/** Converts between CSS style string and object representations. */
		function convertStyleFormat(style: Record<string, string>): string;
		/** Converts camelCase into hyphen-case. */
		function camelToHyphen(value: string): string;
		/** Converts dash or underscore separated text into camelCase. */
		function toCamelCase(value: string): string;
		/** Waits for a condition before invoking the callback or timing out. */
		function waitFor(condition: () => unknown, callback: () => void, timelimit?: TimeLimitSpecifier, failCallback?: () => void): void;
		/** Validates absolute or relative URLs. */
		function isUrl(url: string, relative?: boolean): boolean;
		/** Checks whether an object has no enumerable own properties. */
		function isEmptyObject(object: Record<string, unknown>): boolean;
		/** Normalises Illustrator-generated identifiers into readable names. */
		function AI_name_fix(name: string): string;
		/** Extracts a numeric dimension from an element or bounding box. */
		function dimFromElement(el: Element | BBox, dim: keyof BBox | string): number;
		/** Evaluates a dimension expression bounded within optional limits. */
		function varDimension(value: string | number | [string | number, string | number | undefined, string | number | undefined], space: number, negative?: boolean): number;
		/** Selects the first element that matches the CSS selector. */
		function select<T extends Element = Element>(selector: string): T | null;
		/** Selects all elements that match the CSS selector. */
		function selectAll<T extends Element = Element>(selector: string): Set<T>;
		/** Runs a plugin initialiser. */
		function plugin(initialiser: (Snap: SnapFunction, Element: ElementStatic, Paper: PaperStatic, glob: { win: Window; doc: Document }, Fragment: FragmentStatic, eve: any, mina?: MinaNamespace) => void): void;
		/** Exposes the animation engine. */
		const mina: MinaNamespace;
		/** Exposes the eve event emitter in builds that bundle it. */
		const eve: any;
		/** Exposes the animation descriptor constructor. */
		function animation(attributes: Attributes, duration: number, easing?: MinaEasing, callback?: (animation: MinaAnimation) => void): AnimationDescriptor;
		/** Animates a generic value using a setter callback. */
		function animate<T extends AnimationValue>(from: T, to: T, setter: MinaSetter<T>, duration: number, easing?: MinaEasing, callback?: (animation: MinaAnimation<T>) => void): MinaAnimation<T>;
		/** Returns an empty set. */
		function set<T extends Element = Element>(...items: T[]): Set<T>;
		/** Exposes the set constructor. */
		const Set: SetStatic;
		/** Exposes the bounding-box constructor. */
		const BBox: BBoxStatic;
		/** Exposes the static complex-number utilities. */
		const Complex: ComplexStatic;
		/** Exposes the reusable non-linear transform builders. */
		const NonlinTransforms: NonlinTransforms;
		/** Exposes registered font-loading and text-path helpers. */
		const font: FontNamespace;
		/** Exposes SVG filter fragment builders. */
		const filter: FilterNamespace;
		/** Material design colour palette. */
		const mui: MaterialColors;
		/** Flat UI colour palette. */
		const flat: FlatColors;
		/** Imports Material palette entries into the global object. */
		function importMUIColors(): void;
		/** Returns a palette colour by its ordinal index. */
		function getIndexColor(index: number): string | NamedColor;
		/** Utility namespace for path manipulation. */
		const path: SnapPath;
		/** Exposes Bézier utilities. */
		const bUtils: Record<string, any>;
		/** Creates a Bézier helper from its coordinates. */
		function bezier(...coordinates: number[]): Record<string, any>;
		/** Creates a poly-Bézier helper from curve descriptors. */
		function polyBezier(...curves: unknown[]): PolyBezier;
		/** Exposes the legacy box helper. */
		function box(x: number | number[] | BoundsLike | BBox, y?: number, width?: number, height?: number): BBox;
		/** Returns a bounding box enclosing the supplied points. */
		function bBoxFromPoints(points: Point2DList, matrix?: MatrixLike): BBox;
		/** Returns the union of the supplied bounding boxes. */
		function joinBBoxes(boxes: BBox[]): BBox;
		/** Measures text using the browser's text layout engine. */
		function measureTextClientRect(text: Element): BBox;
		/** Returns or normalizes the URL used for SVG paint references. */
		function url(value?: string): string;
		/** Rewrites a URL for safe SVG attribute use. */
		function fixUrl(value: string): string;
		/** Finds or wraps an element by id. */
		function elementFormId(id: string): Element | null;
		/** Removes a URL wrapper from an attribute value. */
		function deurl(value: string): string;
		/** Delays an animation to a given value using the global animation engine. */
		function round(value: number, precision?: number): number;
		/** Removes non-printable characters from a string. */
		function removeNonPrintable(value: string): string;
		/** Converts a string to title case. */
		function titleCase(value: string): string;
		/** Compares two arrays, optionally comparing nested arrays. */
		function array_equal(first: unknown[], second: unknown[], deep?: boolean): boolean;
		/** Copies an object and optionally applies a patch. */
		function objectCopy<T>(value: T, patch?: Partial<T>): T;
		/** Flattens a nested object into a dotted-key object. */
		function flattenObject(value: Record<string, unknown>, prefix?: string, result?: Record<string, unknown>): Record<string, unknown>;
		/** Parses an SVG path string into an array representation. */
		function parsePathString(path: string | Array<string | number>): Array<string | number>;
		/** Parses a transform string into component commands. */
		function parseTransformString(transform: string | Array<string | number>): Array<string | number> | null;
		/** Converts hex/HSL/HSB strings into a colour object. */
		function color(color: string): RGBColor & { hsb: NumberPair; rgb: NumberPair; hsl: NumberPair; opacity: number };
		/** Converts HSB values to a hex colour string. */
		function hsb(h: number, s: number, b: number): string;
		/** Converts HSL values to a hex colour string. */
		function hsl(h: number, s: number, l: number): string;
		/** Converts RGB values to a hex colour string. */
		function rgb(r: number, g: number, b: number, o?: number): string;
		/** Converts HSB values to RGB components. */
		function hsb2rgb(h: number | { h: number; s: number; b: number; o?: number }, s?: number, b?: number, o?: number): RGBColor;
		/** Converts HSL values to RGB components. */
		function hsl2rgb(h: number | { h: number; s: number; l: number; o?: number }, s?: number, l?: number, o?: number): RGBColor;
		/** Converts RGB values to HSB components. */
		function rgb2hsb(r: number | { r: number; g: number; b: number; opacity?: number }, g?: number, b?: number): { h: number; s: number; b: number; opacity: number };
		/** Converts RGB values to HSL components. */
		function rgb2hsl(r: number | { r: number; g: number; b: number; opacity?: number }, g?: number, b?: number): { h: number; s: number; l: number; opacity: number };
		/** Converts RGB components in the `[0,1]` range to CMYK values. */
		function rgb2cmyk(r: number, g: number, b: number): CMYKColor;
		/** Converts CMYK components to 8-bit RGB values. */
		function cmykToRgb(c: number, m: number, y: number, k: number): RGBTriplet;
		/** Convenience helper that returns an RGBA string. */
		function rgba(r: number, g: number, b: number, a: number): string;
		/** Convenience helper that returns an HSLA string. */
		function hsla(h: number, s: number, l: number, a: number): string;
		/** Returns the first ancestor element at the specified coordinates. */
		function getElementByPoint(x: number, y: number): Element | null;
	/**
	 * Collection of helpers for path manipulation. Only the most commonly used
	 * functions are modelled explicitly; additional helpers are typed as `any` to
	 * keep the definition manageable.
	 */
	type PathInput = string | Array<string | number> | Element;
	type PathSegmentArray = Array<string | number>;
	type PathCompoundSegment = string | PathSegmentArray;

	interface SnapPath {
		/** Returns the bounding box of the supplied path. */
		getBBox(path: PathInput): BBox;
		/** Returns the length of the path. */
		getTotalLength(path: PathInput): number;
		/** Returns a point at the given length along the path. */
		getPointAtLength(path: PathInput, length: number): PointOnPath;
		/** Returns a subpath between two lengths. */
		getSubpath(path: PathInput, from: number, to: number): string;
		/** Converts various element types into path elements or strings. */
		toPath(element: Element, stringOnly?: boolean): Element | string | null;
		/** Determines whether a path contains compound segments. */
		isCompound(path: PathInput): boolean;
		/** Returns control points extracted from a path. */
		getControlPoints(path: PathInput, segmentPoints?: boolean, skipSameLast?: boolean): NumberPair[];
		/** Determines whether a path can be treated as a polygon. */
		isPolygon(path: PathInput): boolean;
		/** Splits compound paths into individual segments. */
		getCompoundSegments(path: PathInput): PathCompoundSegment[] | null;
		/** Determines the type of a path point using its handles. */
		getPointType(center: Point2D, after: Point2D, before: Point2D): PathPointType;
		/** Smooths a path corner by adjusting its handles. */
		smoothCorner(center: Point2D, after: Point2D, before: Point2D, symmetric?: boolean, modifyPoints?: boolean): [Point2D, Point2D] | undefined;
		/** Finds the bounding box for a cubic curve segment. */
		bezierBBox(...points: number[]): BBox;
		/** Returns intersection points between two paths. */
		intersection(path1: PathInput, path2: PathInput): Array<Point2D & { t1: number; t2: number }>;
		/** Returns the number of intersections between two paths. */
		intersectionNumber(path1: PathInput, path2: PathInput): number;
		/** Checks whether a path overlaps a rectangle. */
		isPathOverlapRect(path: PathInput, rect: BoundsLike | BBox): boolean;
		/** Determines whether a point lies inside a path. */
		isPointInside(path: PathInput, x: number, y: number): boolean;
		/** Converts path data to an array of Bézier segments. */
		toBeziers(path?: PathInput | PathPoint[] | { getSegmentAnalysis(): PathPoint[] }, segmented?: boolean): unknown[];
		/** Builds cubic Bézier control points from third-point samples. */
		cubicFromThirdPoints(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): Point2D[];
		/** Returns dot coordinates along a cubic Bézier segment. */
		findDotsAtSegment(p1x: number, p1y: number, c1x: number, c1y: number, c2x: number, c2y: number, p2x: number, p2y: number, t: number, pointOnly?: boolean): BezierDot | Point2D;
		/** Checks whether a bounding box contains a point. */
		isPointInsideBBox(bbox: BoundsLike | BBox, x: number, y: number): boolean;
		/** Checks whether two bounding boxes intersect. */
		isBBoxIntersect(bbox1: BoundsLike | BBox, bbox2: BoundsLike | BBox): boolean;
		/** Normalises a path into absolute commands. */
		toAbsolute(path: string | Array<string | number>): PathSegmentArray;
		/** Normalises a path into relative commands. */
		toRelative(path: string | Array<string | number>): PathSegmentArray;
		/** Converts a path string into a curve array. */
		toCubic(path: string | Array<string | number>): PathSegmentArray;
		/** Returns the path string representation. */
		toString(): string;
		/** Clones a path array. */
		clone(path: string | Array<string | number>): PathSegmentArray;
		/** Applies a matrix to a path array. */
		map(path: string | Array<string | number>, matrix: MatrixLike): PathSegmentArray;
		/** Samples points along the path at equal intervals. */
		getPointSample(path: PathInput, sample?: number): Point2DList | null;
		/** Returns a cached path getter table. */
		readonly get: { [type: string]: ((el: Element) => PathSegmentArray) | undefined; deflt?: (el: Element) => PathSegmentArray };
		/** Additional helpers retained for compatibility. */
		[helper: string]: any;
	}

	// Constructors -------------------------------------------------------------

	interface ElementStatic {
		new (node: SVGElement): Element;
		prototype: Element;
	}

	interface PaperStatic {
		new (width: number | string | SVGElement, height?: number | string): Paper;
		prototype: Paper;
	}

	interface FragmentStatic {
		new (node: DocumentFragment): Fragment;
		prototype: Fragment;
	}

	interface SetStatic {
		new <T extends Element = Element>(items?: T[]): Set<T>;
		prototype: Set<any>;
	}
}

export = Snap;
