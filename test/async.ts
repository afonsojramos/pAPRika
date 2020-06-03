import fc from 'fast-check'
import { describe, it } from 'mocha'

class AsyncQueue<T> {
	private queue = Array<T>()
	private waitingEnqueue: AsyncSemaphore

	constructor(readonly maxSize: number) {
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
		if (this.promises.length! > 0) this.promises.pop()()
	}

	async wait() {
		if (this.permits == 0 || this.promises.length > 0) await new Promise((r) => this.promises.unshift(r))
		this.permits -= 1
	}
}

describe.only('the failing test', () => {
	it('test #1 {testAsyncQueueBehavior}', () => {
		fc.assert(
			fc.asyncProperty(
				fc.array(
					fc.boolean().map((b) => (b ? 'E' : 'D')),
					1000
				),
				async (ns) => testAsyncQueueBehavior(ns)
			),
			{ numRuns: 100 }
		)
	})
})

async function testAsyncQueueBehavior(ops: Array<'E' | 'D'>): Promise<boolean> {
	const result = new Array<number>()
	const q = new AsyncQueue<number>(100)
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
