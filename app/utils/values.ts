import { TankRecord } from '../types'

namespace values {
  export function bulletPower(tank: TankRecord) {
    if (tank.side === 'player' && tank.level === 'armor') {
      return 3
    } else if (tank.side === 'bot' && tank.level === 'power') {
      return 2
    } else {
      return 1
    }
  }

  export function moveSpeed(tank: TankRecord) {
    // todo 需要校准数值
    if (tank.side === 'player') {
      return DEV.FAST ? 0.06 : 0.045
    } else {
      if (tank.level === 'power') {
        return 0.045
      } else if (tank.level === 'fast') {
        return 0.06
      } else {
        // baisc or armor
        return 0.03
      }
    }
  }

  export function bulletInterval(tank: TankRecord) {
    // todo 需要校准数值
    if (tank.level === 'basic') {
      return 300
    } else {
      return 200
    }
  }

  export function bulletLimit(tank: TankRecord) {
    if (tank.side === 'bot' || tank.level === 'basic' || tank.level === 'fast') {
      return 1
    } else {
      return 2
    }
  }

  export function bulletSpeed(tank: TankRecord) {
    // todo 需要校准数值
    if (tank.side === 'player') {
      if (DEV.FAST) {
        return 0.3
      }
      if (tank.level === 'basic') {
        return 0.12
      } else {
        return 0.18
      }
    } else {
      if (tank.level === 'basic') {
        return 0.12
      } else if (tank.level === 'power') {
        return 0.24
      } else {
        return 0.18
      }
    }
  }
}

export default values
