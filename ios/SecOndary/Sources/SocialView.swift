import SwiftUI

struct SocialView: View {
    @EnvironmentObject private var session: AppSession
    @State private var friends: [FriendDTO] = []
    @State private var weekly: WeeklyResponse?
    @State private var code = ""
    @State private var msg: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            List {
                if let me = session.me {
                    Section("Tu código") {
                        Text(me.user.socialCode6)
                            .font(.system(.title2, design: .monospaced))
                            .foregroundStyle(Color(red: 0, green: 0.96, blue: 0.78))
                        Text("@\(me.user.username)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Section("Agregar amigo") {
                    TextField("6 dígitos", text: $code)
                        .keyboardType(.numberPad)
                    Button("Agregar") { Task { await add() } }
                        .disabled(code.count != 6 || busy)
                    if let msg { Text(msg).font(.caption) }
                }
                Section("Ranking semanal") {
                    if let w = weekly {
                        ForEach(Array(w.ranking.enumerated()), id: \.element.id) { i, r in
                            HStack {
                                Text("#\(i + 1)")
                                    .foregroundStyle(.secondary)
                                Text(r.displayName)
                                if r.isYou { Image(systemName: "star.fill").foregroundStyle(.yellow) }
                                Spacer()
                                Text("\(r.weeklyXp) XP")
                                    .foregroundStyle(Color(red: 0.75, green: 0.37, blue: 1))
                            }
                        }
                    } else {
                        ProgressView()
                    }
                }
                Section("Amigos") {
                    ForEach(friends) { f in
                        HStack {
                            Text(f.displayName)
                            Spacer()
                            Text("\(f.xp) XP").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Social")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        busy = true
        defer { busy = false }
        do {
            friends = try await session.fetchFriends()
            weekly = try await session.fetchWeekly()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func add() async {
        busy = true
        defer { busy = false }
        do {
            try await session.addFriend(code: code)
            code = ""
            msg = "Listo"
            await load()
        } catch {
            msg = error.localizedDescription
        }
    }
}
