import { useActivityStore } from '@/stores/activityStore'

/**
 * Fire-and-forget helpers for logging activity events.
 * All functions call logActivity without awaiting or propagating errors.
 */

function log(entry: {
  board_id: string
  user_id: string
  action: string
  metadata?: Record<string, unknown>
}) {
  // Intentionally not awaited — fire-and-forget
  useActivityStore.getState().logActivity(entry)
}

export function logCardCreated(
  boardId: string,
  userId: string,
  cardTitle: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'card_created',
    metadata: { card_title: cardTitle },
  })
}

export function logCardMoved(
  boardId: string,
  userId: string,
  cardTitle: string,
  fromList: string,
  toList: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'card_moved',
    metadata: { card_title: cardTitle, from_list: fromList, to_list: toList },
  })
}

export function logCardDeleted(
  boardId: string,
  userId: string,
  cardTitle: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'card_deleted',
    metadata: { card_title: cardTitle },
  })
}

export function logCardUpdated(
  boardId: string,
  userId: string,
  cardTitle: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'card_updated',
    metadata: { card_title: cardTitle },
  })
}

export function logMemberAdded(
  boardId: string,
  userId: string,
  memberName: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'member_added',
    metadata: { member_name: memberName },
  })
}

export function logMemberRemoved(
  boardId: string,
  userId: string,
  memberName: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'member_removed',
    metadata: { member_name: memberName },
  })
}

export function logListCreated(
  boardId: string,
  userId: string,
  listTitle: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'list_created',
    metadata: { list_title: listTitle },
  })
}

export function logListDeleted(
  boardId: string,
  userId: string,
  listTitle: string
) {
  log({
    board_id: boardId,
    user_id: userId,
    action: 'list_deleted',
    metadata: { list_title: listTitle },
  })
}
