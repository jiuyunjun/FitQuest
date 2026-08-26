import { Game } from '../../Game'

/**
 * 唯一一个小程序页面。冒险 / 角色 / 图鉴 / 数据 / 战斗 / 结算
 * 全部在 Game 内部切换 —— 战斗页需要在切屏时保持传感器会话不断，
 * 走小程序的 navigateTo 会重建页面栈，把训练中的状态机打断。
 */
export default function Index() {
  return <Game />
}
