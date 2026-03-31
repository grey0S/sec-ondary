import SwiftUI

private let diffLabels: [String: String] = [
    "VERY_EASY": "Muy fácil",
    "EASY": "Fácil",
    "MEDIUM": "Media",
    "HARD": "Difícil",
    "EXPLOSIVE": "Explosiva",
]

struct HomeView: View {
    @EnvironmentObject private var session: AppSession
    @State private var active: ActiveMissionsResponse?
    @State private var context = ""
    @State private var busy = false
    @State private var message: String?
    @State private var toComplete: MissionDTO?
    @State private var showLevelUp = false

    private var urgent: MissionDTO? { active?.urgent }
    private var daily: MissionDTO? {
        active?.daily ?? active?.missions.first(where: { $0.kind == "NORMAL" })
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    urgentSection
                    dailySection
                    generateSection
                    otherMissions
                }
                .padding(.vertical)
            }
            .background(Color(red: 0.03, green: 0.03, blue: 0.07))
            .navigationTitle("sec·ondary")
            .navigationBarTitleDisplayMode(.inline)
            .task { await reload() }
            .refreshable { await reload() }
            .sheet(item: $toComplete) { m in
                MissionCompleteSheet(mission: m) {
                    toComplete = nil
                    Task { await reload() }
                }
                .environmentObject(session)
            }
            .overlay(alignment: .top) {
                if showLevelUp {
                    Text("¡Subiste de nivel!")
                        .font(.headline)
                        .padding()
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .padding(.top, 8)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Misiones IA")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let me = session.me {
                    Text("Nv. \(me.level) · \(me.rank.name)")
                        .font(.headline)
                    Text("\(me.user.xp) XP · racha solo \(me.user.soloStreak) · grupo \(me.user.groupStreak)")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
            Spacer()
        }
        .padding(.horizontal)
    }

    @ViewBuilder
    private var urgentSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MISIÓN URGENTE")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundStyle(Color(red: 1, green: 0.24, blue: 0.48))
            if let u = urgent {
                MissionCard(m: u) {
                    toComplete = u
                }
            } else {
                Text("Sin urgente activa. Generá una (24h + bonus XP).")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Button("Generar urgente") { Task { await gen(urgent: true, explosive: false) } }
                    .buttonStyle(.bordered)
                    .disabled(busy)
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).strokeBorder(Color(red: 1, green: 0.24, blue: 0.48).opacity(0.5)))
        .padding(.horizontal)
    }

    @ViewBuilder
    private var dailySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MISIÓN DEL DÍA")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundStyle(Color(red: 0, green: 0.96, blue: 0.78))
            if let d = daily {
                MissionCard(m: d) { toComplete = d }
            } else {
                ProgressView()
            }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).strokeBorder(Color(red: 0, green: 0.96, blue: 0.78).opacity(0.35)))
        .padding(.horizontal)
    }

    private var generateSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Contexto para la IA")
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField("Casa, calle, noche, shopping…", text: $context, axis: .vertical)
                .lineLimit(3 ... 5)
                .textFieldStyle(.roundedBorder)
            Button("Nueva misión aleatoria") { Task { await gen(urgent: false, explosive: false) } }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0, green: 0.96, blue: 0.78))
                .disabled(busy)
            Button("Misión explosiva (grupo)") { Task { await gen(urgent: false, explosive: true) } }
                .disabled(busy)
            if let message { Text(message).font(.caption).foregroundStyle(.secondary) }
        }
        .padding()
        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
        .padding(.horizontal)
    }

    @ViewBuilder
    private var otherMissions: some View {
        let others = (active?.missions ?? []).filter { m in
            m.id != daily?.id && m.id != urgent?.id
        }
        if !others.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Otras activas")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ForEach(others) { m in
                    MissionCard(m: m) { toComplete = m }
                }
            }
            .padding(.horizontal)
        }
    }

    private func reload() async {
        guard session.token != nil else { return }
        busy = true
        defer { busy = false }
        do {
            _ = try await session.postDaily(context: "")
            active = try await session.fetchActiveMissions()
            let before = session.me?.level
            await session.refreshMe()
            if let before, let after = session.me?.level, after > before {
                showLevelUp = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    showLevelUp = false
                }
            }
            message = nil
        } catch {
            message = error.localizedDescription
        }
    }

    private func gen(urgent: Bool, explosive: Bool) async {
        busy = true
        defer { busy = false }
        do {
            _ = try await session.generateMission(context: context, urgent: urgent, explosive: explosive, duelId: nil)
            message = urgent ? "Urgente lista." : "Nueva misión."
            await reload()
        } catch {
            message = error.localizedDescription
        }
    }
}

struct MissionCard: View {
    let m: MissionDTO
    let onComplete: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(m.title)
                .font(.headline)
            Text(m.description)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(diffLabels[m.difficulty] ?? m.difficulty) · \(m.baseXp) XP base")
                .font(.caption2)
                .foregroundStyle(.tertiary)
            Button("Completar", action: onComplete)
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 0.75, green: 0.37, blue: 1))
        }
    }
}

struct MissionCompleteSheet: View {
    let mission: MissionDTO
    var onDone: () -> Void

    @EnvironmentObject private var session: AppSession
    @Environment(\.dismiss) private var dismiss
    @State private var friends: [FriendDTO] = []
    @State private var picked: Set<String> = []
    @State private var reaction = "⚡"
    @State private var busy = false
    @State private var err: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Participantes") {
                    if let uid = session.me?.user.id {
                        Toggle(isOn: Binding(
                            get: { picked.contains(uid) },
                            set: { on in
                                var s = picked
                                if on { s.insert(uid) } else { s.remove(uid) }
                                picked = s
                            }
                        )) {
                            Text("Tú (\(session.me?.user.displayName ?? ""))")
                        }
                    }
                    ForEach(friends) { f in
                        Toggle(isOn: Binding(
                            get: { picked.contains(f.id) },
                            set: { on in
                                var s = picked
                                if on { s.insert(f.id) } else { s.remove(f.id) }
                                picked = s
                            }
                        )) {
                            Text(f.displayName)
                        }
                    }
                }
                Section("Reacción") {
                    TextField("Emoji", text: $reaction)
                }
                if let err { Section { Text(err).foregroundStyle(.red) } }
            }
            .navigationTitle("Completar")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ganar XP") { Task { await submit() } }
                        .disabled(busy)
                }
            }
            .task {
                if let uid = session.me?.user.id { picked = [uid] }
                if let f = try? await session.fetchFriends() { friends = f }
            }
        }
    }

    private func submit() async {
        busy = true
        err = nil
        defer { busy = false }
        do {
            let ids = Array(picked)
            try await session.completeMission(id: mission.id, participantIds: ids, memoryPhoto: nil, reaction: reaction)
            await session.refreshMe()
            dismiss()
            onDone()
        } catch {
            err = error.localizedDescription
        }
    }
}
