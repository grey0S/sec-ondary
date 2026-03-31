import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var session: AppSession
    @State private var history: [HistoryRow] = []
    @State private var dname = ""
    @State private var uname = ""
    @State private var msg: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            List {
                if let me = session.me {
                    Section("Estado") {
                        Text("Nv. \(me.level) · \(me.rank.name)")
                        Text("\(me.user.xp) XP")
                        Text("Racha solo \(me.user.soloStreak) (máx \(me.user.soloStreakBest))")
                        Text("Racha grupo \(me.user.groupStreak) (máx \(me.user.groupStreakBest))")
                        if let t = me.user.equippedTitle { Text("Título: \(t)") }
                    }
                }
                Section("Editar (usuario: 15 días entre cambios)") {
                    TextField("Nombre visible", text: $dname)
                    TextField("Usuario", text: $uname)
                    Button("Guardar") { Task { await save() } }
                        .disabled(busy)
                }
                Section("Historial") {
                    ForEach(history) { h in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(h.mission.title).font(.subheadline.weight(.semibold))
                            Text("+\(h.xpReceived) XP · \(h.wasSolo ? "solo" : "grupo")\(h.wasUrgent ? " · urgente" : "")\(h.wasExplosive ? " · explosiva" : "") \(h.mission.reactionEmoji ?? "")")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                Section {
                    Button("Cerrar sesión en este dispositivo", role: .destructive) {
                        session.logout()
                        Task { await session.bootstrapIfNeeded() }
                    }
                }
                if let msg { Section { Text(msg).font(.caption) } }
            }
            .navigationTitle("Perfil")
            .task {
                if let me = session.me {
                    dname = me.user.displayName
                    uname = me.user.username
                }
                await loadHistory()
            }
            .refreshable { await loadHistory() }
        }
    }

    private func loadHistory() async {
        do {
            history = try await session.fetchHistory()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func save() async {
        busy = true
        defer { busy = false }
        do {
            try await session.patchProfile(displayName: dname, username: uname)
            msg = "Guardado"
        } catch {
            msg = error.localizedDescription
        }
    }
}
