import { assert, asyncProperty, nat as aNat, array as anArray, boolean as aBoolean } from 'fast-check'
import { describe, it } from 'mocha'
import { expect } from 'chai'

class AsyncQueue<T> {
	private queue = Array<T>()
	private waitingEnqueue: AsyncSemaphore
	s = (test: any) => {
		console.log(test)

		return 's'
		return 'si'
	}

	constructor() {
		this.waitingEnqueue = new AsyncSemaphore(0)
	}

	async enqueue(x: T) {
		this.queue.unshift(x)
		this.waitingEnqueue.signal()
	}

	async dequeue() {
		await this.waitingEnqueue.wait()
		return this.queue.pop()!
	}
}

class AsyncSemaphore {
	private promises = Array<() => void>()

	constructor(private permits: number) {}

	signal() {
		this.permits += 1
		if (this.promises.length! > 0) this.promises.pop()
	}

	async wait() {
		if (this.permits == 0 || this.promises.length > 0) await new Promise((r) => this.promises.unshift(r))
		this.permits -= 1
	}
}

describe('the failing tests', () => {
	it('test #1 {AsyncSemaphore.wait}', async () => {
		await assert(
			asyncProperty(
				aNat(10),
				anArray(
					aBoolean().map((b) => (b ? 'S' : 'W')),
					100
				),
				async (size, ops) => testSemaphore(size, ops)
			),
			{ numRuns: 5 }
		)
	})

	/* it('test #2 {AsyncSemaphore.wait}', async () => {
		await assert(
			asyncProperty(
				anArray(
					aBoolean().map((b) => (b ? 'E' : 'D')),
					1000
				),
				async (ns) => testAsyncQueueBehavior(ns)
			),
			{ numRuns: 100 }
		)
	})

	it('test #1 {AsyncQueue.s}', () => {
		const q = new AsyncQueue<number>()
		expect(q.s('This is a string')).to.equal('si')
	}) */
})

async function testSemaphore(size: number, ops: Array<'S' | 'W'>) {
	const sem = new AsyncSemaphore(size)
	const res = Array<boolean>()
	const promises = Array<Promise<void>>()

	let signals = 0,
		waits = 0

	for (const op of ops) {
		if (op === 'S') {
			signals += 1
			sem.signal()
		} else {
			waits += 1
			promises.push(
				sem.wait().then(() => {
					res.push(true)
				})
			)
		}
	}

	await Promise.all(promises.slice(0, signals + size))

	return res.length === Math.min(signals + size, waits)
}

async function testAsyncQueueBehavior(ops: Array<'E' | 'D'>): Promise<boolean> {
	const result = new Array<number>()
	const q = new AsyncQueue<number>()
	const promises = Array<Promise<void>>()

	let enqueues = 0,
		dequeues = 0

	for (const op of ops) {
		if (op === 'E') {
			enqueues += 1
			q.enqueue(enqueues)
		} else {
			dequeues += 1
			promises.push(
				q.dequeue().then((v) => {
					result.push(v)
				})
			)
		}
	}

	const pending = Math.min(enqueues, dequeues)
	await Promise.all(promises.slice(0, pending))

	// Length should be equal minimum between enqueues and dequeues
	const isLengthOk = pending === result.length

	// Messages should be ordered
	const isSorted = isArraySorted(result)

	return isLengthOk && isSorted
}

function isArraySorted(arr: number[]) {
	let sorted: boolean = true

	for (let i = 0; i < arr.length - 1; i++) {
		if (arr[i] > arr[i + 1]) {
			sorted = false
			break
		}
	}

	return sorted
}
