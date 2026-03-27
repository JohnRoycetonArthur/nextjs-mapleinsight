import {articleType} from './articleType'
import {authorType} from './authorType'
import {calculatorType} from './calculatorType'
import {categoryType} from './categoryType'
import {consultantType} from './consultantType'
import {cityBaselineType} from './cityBaselineType'
import {dataSourceType} from './dataSourceType'
import {immigrationFeesType} from './immigrationFeesType'

export const schema = {
  types: [categoryType, authorType, articleType, calculatorType, consultantType, cityBaselineType, dataSourceType, immigrationFeesType],
}