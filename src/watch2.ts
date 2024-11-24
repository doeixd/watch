import { setupGlobals } from './utils/setupGlobals'
import { createObserver } from './watch'
import { withCleanup, withOn, withState, withArrayInfo, withMutationRecord, withTextChange, withAttributeChange, withCustomEvents, withStyle, withDefaultReturn } from './wrappers'
import { ArgsWithArrayInfo } from './wrappers/withArrayInfo'
import { ArgsWithMutation } from './wrappers/withMutationRecord'
import { withReturnArgs } from './wrappers/withReturn'


class WatchError extends Error {}
class InvalidArgument extends WatchError {}

type ConditionFn = (el: Element, match: (...els: Element[]) => void, check: (...els: Element[]) => void) => void

function getMatchingElementsFromConditionFn(conditionFn: ConditionFn, initialElements: Element[] = []) {
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

function getMatchingElements(selectorOrCondition: string | ConditionFn, elements: Node[] | NodeList = [], isCondition: boolean, isSelector: boolean, shouldTestAgainstSelector: boolean = false): Element[] {
	elements = Array.from(elements)

	elements = elements?.filter((el) => {
		const target = el as unknown
		const isTargetElement = target instanceof Element
		if (!isTargetElement) return false
		return true
	})

	if (isSelector && !shouldTestAgainstSelector) return elements as Element[]

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

	const matchingElements = getMatchingElementsFromConditionFn(conditionFn, elements as Element[])

	return matchingElements
}

export function addDefaultBehaviorsWrapper(setupFn: SetupFn) {
	return function callSetupFnWithArgsThatHaveDefaultBehaviors(args: Parameters<typeof setupFn>[0]) {
		let result = [ withOn, withCleanup, withState, withTextChange, withAttributeChange, withCustomEvents, withStyle, withDefaultReturn, withReturnArgs].reduceRight((acc, cur) => cur(acc), setupFn)(args)

		return result
	}
}

export function createSetupFnWithDefaultBehaviors () {
	

}

export type WatchOptions<P extends Node = typeof document, I extends (...args) => Element[] = (...args) => Element[]> = {
	parent?: P,
	initialQuery?: I
}

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type BasicArgs<El extends Node = HTMLElement, ToReturnValue extends any = any> = Prettify<{
	type: 'added' | 'initial' | 'removed',
	el: El,
	toReturn: { value: ToReturnValue | undefined } 
} & Partial<ArgsWithArrayInfo<unknown>> & Partial<ArgsWithMutation>>;

export type SetupFn<
	ElementType extends Node = HTMLElement, 
	ReturnType extends any = unknown, 
	ArgsType extends BasicArgs<ElementType, ReturnType> = BasicArgs<ElementType, ReturnType>,
	ToReturnType extends unknown = ArgsType
> = (arg: ArgsType) => ToReturnType

export const defaultSetupFn = (args)  => {
	// @ts-expect-error
	if (args?.toReturn) args?.toReturn.value = args

	return args
} 

export function watch<
	W extends WatchOptions = WatchOptions, 
>(selectorOrCondition: string | ConditionFn, setupFn: SetupFn = defaultSetupFn, options: W = {} as W) {
	const isCondition = typeof selectorOrCondition == 'function'
	const isSelector = !isCondition && typeof selectorOrCondition == 'string'
	if (!isCondition || !isSelector)
		throw new InvalidArgument(`[watch-selector]: Selector or Condition passed is invalid passed type ${typeof selectorOrCondition}` + JSON.stringify(selectorOrCondition, null, 2))

	options.parent ||= document
	options.initialQuery ||= () => Array.from((options?.parent || document).querySelectorAll(isCondition && !isSelector ? '*' : selectorOrCondition))

	const toReturn = {
		value: undefined as Parameters<typeof setupFn>[0]['toReturn']['value'],
	} as Parameters<typeof setupFn>[0]['toReturn'] | undefined

	const getMatching = (elements: Node[] | NodeList = options.initialQuery(), shouldTestAgainstSelector = false) =>
		getMatchingElements(selectorOrCondition, elements, isCondition, isSelector, shouldTestAgainstSelector)
	const matchingElements = getMatching()

	for (let [idx, el] of matchingElements.entries()) {
		withArrayInfo(el, idx, matchingElements)(setupFn)({ type: 'initial', el, toReturn })
	}

	createObserver(
		(mutations) => {
			for (let mutation of mutations) {
				const elements = [mutation.target, ...(mutation?.addedNodes || [])]
				const matchingElements = getMatching(elements, true)

				for (let [idx, el] of matchingElements.entries()) {
					withArrayInfo(el, idx, matchingElements)(withMutationRecord(mutation)(setupFn))({ type: 'added', el, toReturn })
				}

				const matchingRemoved = getMatching(mutation.removedNodes, true)
				for (let [idx, el] of matchingRemoved.entries()) {
					withArrayInfo(el, idx, matchingRemoved)(withMutationRecord(mutation)(setupFn))({ type: 'removed', el, toReturn })
				}
			}
		},
		{
			subtree: true,
			childList: true,
			attributes: true,
		}
		// @ts-ignore
	)(parent || document)

	return toReturn.value 
}
