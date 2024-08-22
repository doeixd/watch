import { setupGlobals } from './utils/setupGlobals'
import { createObserver } from './watch'

class WatchError extends Error {}
class InvalidArgument extends WatchError {}

function getMatchingElementsFromConditionFn(conditionFn, initialElements = []) {
	const matches = []
	const match = (...els) => matches.push(...[els].flat())

	const elementsToCheck = initialElements
	const check = (...els) => elementsToCheck.push(...[els].flat())

	while (elementsToCheck.length) {
		let el = elementsToCheck.shift()

		conditionFn(el, match, check)
	}

	return matches
}

function getMatchingElements(selectorOrCondition, elements = [], isCondition, isSelector, shouldTestAgainstSelector = false) {
	if (isSelector && !shouldTestAgainstSelector) return elements

	elements = elements?.filter((el) => {
		const target = el as unknown
		const isTargetElement = target instanceof Element
		if (!isTargetElement) return false
		return true
	})

	let conditionFn
	if (isCondition && !isSelector) {
		conditionFn = selectorOrCondition
		// matchingElements = getMatchingElementsFromConditionFn(conditionFn, getElements)
	}

	if (isSelector) {
		const selector = selectorOrCondition
		conditionFn = (el, match) => {
			const isMatch = Boolean(el?.matches(selector))
			if (isMatch) match(el)
		}
	}

	const matchingElements = getMatchingElementsFromConditionFn(conditionFn, elements)

	return matchingElements
}

export function addDefaultBehaviorsWrapper(setupFn) {
	return function callSetupFnWithArgsThatHaveDefaultBehaviors(args) {
		let result = [withRegister, withState, withCleanup, withOn, withStyle, withCallableEl].reduceRight((acc, cur) => cur(acc), setupFn)(args)

		return result
	}
}

export function watch(selectorOrCondition, setupFn, options = { parent: document, wrapper: (fn) => (args) => fn(args), initialQuery: this.parent }) {
	const isCondition = typeof selectorOrCondition == 'function'
	const isSelector = !isCondition && typeof selectorOrCondition == 'string'
	if (!isCondition || !isSelector)
		throw new InvalidArgument(`[watch-selector]: Selector or Condition passed is invalid passed type ${typeof selectorOrCondition}` + JSON.stringify(selectorOrCondition, null, 2))

	options.parent ||= document
	options.initialQuery ||= () => Array.from((options?.parent || document).querySelectorAll(isCondition && !isSelector ? '*' : selectorOrCondition))

	options.wrapper ||= addDefaultBehaviorsWrapper
	if (options.wrapper) setupFn = options.wrapper(setupFn)

	const getMatching = (elements = options.initialQuery(), shouldTestAgainstSelector = false) =>
		getMatchingElements(selectorOrCondition, elements, isCondition, isSelector, shouldTestAgainstSelector)
	const matchingElements = getMatching()

	matchingElements.forEach((el, idx, arr) => withArrayInfo(el, idx, arr)(setupFn)({ type: 'initial' }))

	createObserver(
		(mutations) => {
			for (let mutation of mutations) {
				const elements = [mutation.target, ...(mutation?.addedNodes || [])]
				const matchingElements = getMatching(elements, true)

				for (let [idx, el] of matchingElements.entries()) {
					withArrayInfo(el, idx, matchingElements)(withMutationRecord(mutation)(setupFn))({ type: 'added' })
				}

				const matchingRemoved = getMatching(mutation.removedNodes, true)
				for (let [idx, el] of mutation.removedNodes.entries()) {
					withArrayInfo(el, idx, matchingRemoved)(withMutationRecord(mutation)(setupFn))({ type: 'removed' })
				}
			}
		},
		{
			subtree: true,
			childList: true,
			attributes: true,
		}
	)(parent || document)
}
