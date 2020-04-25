import React from 'react'
import { connect } from 'react-redux'
import { withTranslation } from 'react-i18next'
import _ from 'lodash'
import Modal from 'react-modal'
import { DatePicker, Slider, Col, Row, Switch } from 'antd'
import Moment from 'moment'
import { extendMoment } from 'moment-range'

import Column from './Column'
import ModalContent from './ModalContent'
import Tab from './Tab'
import Search from './Search'
import { setCurrentOrder, orderCreated, setPreparationDelay, changeStatus, setActiveTab } from '../redux/actions'

const moment = extendMoment(Moment)

const orderSort = (a, b) => {

  const rangeA = moment.range(a.shippingTimeRange)
  const rangeB = moment.range(b.shippingTimeRange)

  if (rangeA.start.isSame(rangeB.start)) {
    return 0
  }

  return rangeA.start.isBefore(rangeB.start) ? -1 : 1
}

const orderComparator = (a, b) => a['@id'] === b['@id']

class Dashboard extends React.Component {

  constructor(props) {
    super(props)
    this.sliderMarks = {
      0: props.t('RESTAURANT_DASHBOARD_DELAY_MARK_NONE'),
      15: '15min',
      30: '30min',
      60: '1h',
      90: '1h30',
    }
  }

  componentDidMount() {
    $(function () {
      $('[data-toggle="popover"]').tooltip()
    })
  }

  afterOpenModal() {
  }

  closeModal() {
    this.props.setCurrentOrder(null)
  }

  _tipFormatter(value) {
    return this.sliderMarks[value]
  }

  render() {

    return (
      <div className="FoodtechDashboard">
        <div className="FoodtechDashboard__Navbar">
          { this.props.showSettings && (
            <div className="FoodtechDashboard__Navbar__Slider">
              <Row type="flex" align="middle">
                <Col span={ 6 }>
                  <span>
                    <i className="fa fa-clock-o"></i> { this.props.t('RESTAURANT_DASHBOARD_DELAY_SETTING') }
                  </span>
                </Col>
                <Col span={ 18 }>
                  <Slider
                    max={ 90 }
                    defaultValue={ this.props.preparationDelay }
                    marks={ this.sliderMarks }
                    step={ null }
                    tipFormatter={ this._tipFormatter.bind(this) }
                    onChange={ delay => this.props.setPreparationDelay(delay) } />
                </Col>
              </Row>
            </div>
          )}
          { this.props.showSearch && (
            <div className="FoodtechDashboard__Navbar__Search">
              <Search />
            </div>
          )}
          { this.props.restaurant && (
            <div>
              <Switch
                unCheckedChildren={ this.props.t('ADMIN_DASHBOARD_NORMAL') }
                checkedChildren={ this.props.t('ADMIN_DASHBOARD_RUSH') }
                onChange={ checked => {
                  this.props.changeStatus(this.props.restaurant, checked ? 'rush' : 'normal')
                }}
                defaultChecked={ this.props.isRushEnabled }
              />
              <div className="glyphicon glyphicon-question-sign rushInfoSize"
                data-toggle="popover"
                data-placement="right"
                title={ this.props.t('RESTAURANT_DASHBOARD_INFO_RUSH') }>
              </div>
            </div>
          )}
          <div>
            <DatePicker
              format={ 'll' }
              defaultValue={ moment(this.props.date) }
              onChange={ (date) => this.props.onDateChange(date) } />
          </div>
        </div>
        <div className="FoodtechDashboard__Columns">
          <Column
            orders={ this.props.newOrders }
            title={ this.props.t('RESTAURANT_DASHBOARD_NEW_ORDERS') }
            context="warning"
            active={ this.props.activeTab == 'new' } />
          <Column
            orders={ this.props.acceptedOrders }
            title={ this.props.t('RESTAURANT_DASHBOARD_ACCEPTED_ORDERS') }
            context="info"
            active={ this.props.activeTab == 'accepted' } />
          <Column
            orders={ this.props.fulfilledOrders }
            title={ this.props.t('RESTAURANT_DASHBOARD_FULFILLED_ORDERS') }
            context="success"
            active={ this.props.activeTab == 'fulfilled' } />
          <Column
            orders={ this.props.cancelledOrders }
            title={ this.props.t('RESTAURANT_DASHBOARD_CANCELLED_REFUSED_ORDERS') }
            context="danger"
            active={ this.props.activeTab == 'cancelled' } />
        </div>
        <nav className="FoodtechDashboard__TabNav">
          <Tab
            title={ `${this.props.t('new')} (${this.props.newOrders.length})` }
            target="new"
            onClick={ (tab) => this.props.setActiveTab(tab) }
            active={ this.props.activeTab === 'new' } />
          <Tab
            title={ `${this.props.t('accepted')} (${this.props.acceptedOrders.length})` }
            target="accepted"
            onClick={ (tab) => this.props.setActiveTab(tab) }
            active={ this.props.activeTab === 'accepted' } />
          <Tab
            title={ `${this.props.t('fulfilled')} (${this.props.fulfilledOrders.length})` }
            target="fulfilled"
            onClick={ (tab) => this.props.setActiveTab(tab) }
            active={ this.props.activeTab === 'fulfilled' } />
          <Tab
            title={ `${this.props.t('cancelled')} (${this.props.cancelledOrders.length})` }
            target="cancelled"
            onClick={ (tab) => this.props.setActiveTab(tab) }
            active={ this.props.activeTab === 'cancelled' } />
        </nav>
        <Modal
          isOpen={ this.props.modalIsOpen }
          onAfterOpen={ this.afterOpenModal.bind(this) }
          onRequestClose={ this.closeModal.bind(this) }
          shouldCloseOnOverlayClick={ true }
          contentLabel={ this.props.order ?
            this.props.t('RESTAURANT_DASHBOARD_ORDER_TITLE', { number: this.props.order.number, id: this.props.order.id }) : '' }
          overlayClassName="ReactModal__Overlay--foodtech"
          className="ReactModal__Content--foodtech">
          { this.props.order && <ModalContent order={ this.props.order } /> }
        </Modal>
      </div>
    )
  }
}

function mapStateToProps(state) {

  const orders = state.searchQuery.length > 0 ?
    _.intersectionWith(state.orders, state.searchResults, orderComparator) : state.orders

  // TODO Use Redux selectors
  const newOrders =
    _.filter(orders, order => order.state === 'new')
  const acceptedOrders =
    _.filter(orders, order => order.state === 'accepted')
  const fulfilledOrders =
    _.filter(orders, order => order.state === 'fulfilled')
  const cancelledOrders =
    _.filter(orders, order => order.state === 'refused' || order.state === 'cancelled')

  const isRushEnabled = state.restaurant && state.restaurant.state === 'rush'

  return {
    date: state.date,
    order: state.order,
    modalIsOpen: state.order !== null,
    newOrders: newOrders.sort(orderSort),
    acceptedOrders: acceptedOrders.sort(orderSort),
    fulfilledOrders: fulfilledOrders.sort(orderSort),
    cancelledOrders: cancelledOrders.sort(orderSort),
    preparationDelay: state.preparationDelay,
    showSettings: state.showSettings,
    showSearch: state.showSearch,
    isRushEnabled: isRushEnabled,
    restaurant: state.restaurant,
    activeTab: state.activeTab,
  }
}

function mapDispatchToProps(dispatch) {

  return {
    setCurrentOrder: order => dispatch(setCurrentOrder(order)),
    setPreparationDelay: delay => dispatch(setPreparationDelay(delay)),
    orderCreated: order => dispatch(orderCreated(order)),
    changeStatus: (restaurant, state) => dispatch(changeStatus(restaurant, state)),
    setActiveTab: tab => dispatch(setActiveTab(tab)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(Dashboard))
