import Foundation

extension AppSession {
    func postDaily(context: String = "") async throws -> MissionDTO {
        let (data, res) = try await authorized(path: "/api/missions/daily", method: "POST", jsonBody: ["context": context])
        try throwIfHTTPError(data: data, response: res)
        struct W: Codable { let mission: MissionDTO }
        return try JSONDecoder().decode(W.self, from: data).mission
    }

    func fetchActiveMissions() async throws -> ActiveMissionsResponse {
        let (data, res) = try await authorized(path: "/api/missions/active", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(ActiveMissionsResponse.self, from: data)
    }

    func generateMission(context: String, urgent: Bool, explosive: Bool, duelId: String?) async throws -> MissionDTO {
        var body: [String: Any] = ["context": context]
        if urgent { body["urgent"] = true }
        if explosive { body["explosiveOnly"] = true }
        if let duelId { body["competitive"] = ["duelId": duelId] }
        let (data, res) = try await authorized(path: "/api/missions/generate", method: "POST", jsonBody: body)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(MissionWrap.self, from: data).mission
    }

    func completeMission(id: String, participantIds: [String], memoryPhoto: String?, reaction: String?) async throws {
        var body: [String: Any] = ["participantIds": participantIds]
        if let memoryPhoto { body["memoryPhotoDataUrl"] = memoryPhoto }
        if let reaction { body["reactionEmoji"] = reaction }
        let (data, res) = try await authorized(path: "/api/missions/\(id)/complete", method: "POST", jsonBody: body)
        try throwIfHTTPError(data: data, response: res)
    }

    func fetchFriends() async throws -> [FriendDTO] {
        let (data, res) = try await authorized(path: "/api/friends", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(FriendsResponse.self, from: data).friends
    }

    func addFriend(code: String) async throws {
        let (data, res) = try await authorized(path: "/api/friends", method: "POST", jsonBody: ["socialCode6": code])
        try throwIfHTTPError(data: data, response: res)
    }

    func fetchWeekly() async throws -> WeeklyResponse {
        let (data, res) = try await authorized(path: "/api/social/weekly", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(WeeklyResponse.self, from: data)
    }

    func fetchShop() async throws -> ShopResponse {
        let (data, res) = try await authorized(path: "/api/shop", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(ShopResponse.self, from: data)
    }

    func buyShopItem(id: String) async throws {
        let (data, res) = try await authorized(path: "/api/shop", method: "POST", jsonBody: ["itemId": id])
        try throwIfHTTPError(data: data, response: res)
    }

    func fetchDuels() async throws -> [DuelDTO] {
        let (data, res) = try await authorized(path: "/api/duel", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(DuelsResponse.self, from: data).duels
    }

    func createDuel(durationDays: Int, partnerId: String) async throws -> (DuelDTO, String?) {
        let (data, res) = try await authorized(
            path: "/api/duel",
            method: "POST",
            jsonBody: ["durationDays": durationDays, "partnerId": partnerId]
        )
        try throwIfHTTPError(data: data, response: res)
        struct W: Codable { let duel: DuelDTO; let inviteCode: String? }
        let w = try JSONDecoder().decode(W.self, from: data)
        return (w.duel, w.inviteCode)
    }

    func joinDuel(code: String, partnerId: String) async throws {
        let (data, res) = try await authorized(
            path: "/api/duel/join",
            method: "POST",
            jsonBody: ["inviteCode": code, "partnerId": partnerId]
        )
        try throwIfHTTPError(data: data, response: res)
    }

    func fetchHistory() async throws -> [HistoryRow] {
        let (data, res) = try await authorized(path: "/api/missions/history", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: res)
        return try JSONDecoder().decode(HistoryResponse.self, from: data).history
    }

    func patchProfile(displayName: String, username: String) async throws {
        let (data, res) = try await authorized(
            path: "/api/me",
            method: "PATCH",
            jsonBody: ["displayName": displayName, "username": username]
        )
        try throwIfHTTPError(data: data, response: res)
        me = try JSONDecoder().decode(MeResponse.self, from: data)
    }
}
