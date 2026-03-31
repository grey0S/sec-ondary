import Foundation

struct UserDTO: Codable {
    let id: String
    let displayName: String
    let username: String
    let socialCode6: String
    let xp: Int
    let soloStreak: Int
    let groupStreak: Int
    let soloStreakBest: Int
    let groupStreakBest: Int
    let equippedTitle: String?
    let equippedFrame: String?
    let usernameChangedAt: String?
    let apiToken: String?
}

struct RankDTO: Codable {
    let name: String
}

struct MeResponse: Codable {
    let user: UserDTO
    let rank: RankDTO
    let level: Int
    let apiToken: String?
}

struct BootstrapResponse: Codable {
    let user: UserDTO
    let apiToken: String?
}

struct MissionDTO: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String
    let difficulty: String
    let baseXp: Int
    let minParticipants: Int
    let maxParticipants: Int
    let kind: String
    let urgentDeadlineAt: String?
    let expiresAt: String
}

struct ActiveMissionsResponse: Codable {
    let missions: [MissionDTO]
    let urgent: MissionDTO?
    let daily: MissionDTO?
}

struct MissionWrap: Codable {
    let mission: MissionDTO
}

struct FriendDTO: Codable, Identifiable {
    let id: String
    let displayName: String
    let username: String
    let xp: Int
}

struct FriendsResponse: Codable {
    let friends: [FriendDTO]
}

struct WeeklyRow: Codable, Identifiable {
    var id: String { userId }
    let userId: String
    let weeklyXp: Int
    let displayName: String
    let username: String
    let isYou: Bool
}

struct WeeklyResponse: Codable {
    let weekStart: String
    let ranking: [WeeklyRow]
}

struct ShopItemDTO: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let type: String
    let costXp: Int
    let owned: Bool
}

struct ShopResponse: Codable {
    let rotationSlot: Int
    let items: [ShopItemDTO]
}

struct DuelDTO: Codable, Identifiable, Hashable {
    let id: String
    let status: String
    let durationDays: Int
    let teamAUserIds: String
    let teamBUserIds: String
    let teamAXp: Int
    let teamBXp: Int
    let winnerTeam: Int?
    let invitedCode6: String?
    let endsAt: String?
}

struct DuelsResponse: Codable {
    let duels: [DuelDTO]
}

struct HistoryRow: Codable, Identifiable {
    let id: String
    let xpReceived: Int
    let completedAt: String
    let wasSolo: Bool
    let wasUrgent: Bool
    let wasExplosive: Bool
    let mission: HistoryMission
}

struct HistoryMission: Codable {
    let title: String
    let memoryPhotoDataUrl: String?
    let reactionEmoji: String?
}

struct HistoryResponse: Codable {
    let history: [HistoryRow]
}

struct APIErrorBody: Codable {
    let error: String?
}
