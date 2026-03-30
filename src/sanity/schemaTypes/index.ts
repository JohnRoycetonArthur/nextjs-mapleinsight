import {articleType} from './articleType'
import {authorType} from './authorType'
import {calculatorType} from './calculatorType'
import {categoryType} from './categoryType'
import {consultantType} from './consultantType'
import {cityBaselineType} from './cityBaselineType'
import {dataSourceType} from './dataSourceType'
import {exchangeRateType} from './exchangeRateType'
import {immigrationFeesType} from './immigrationFeesType'
import {publicFeedbackType} from './publicFeedbackType'

export const schema = {
  types: [categoryType, authorType, articleType, calculatorType, consultantType, cityBaselineType, dataSourceType, exchangeRateType, immigrationFeesType, publicFeedbackType],
}
