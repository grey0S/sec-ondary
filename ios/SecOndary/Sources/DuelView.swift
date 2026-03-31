import SwiftUI

struct DuelView: View {
    @EnvironmentObject private var session: AppSession
    @State private var duels: [DuelDTO] = []
    @State private var friends: [FriendDTO] = []
    @State private var duration = 3
    @State private var partnerA = ""
    @State private var invite = ""
    @State private var partnerB = ""
    @State private var duelIdField = ""
    @State private var lastCode: String?
    @State private var msg: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Crear duelo (equipo A)") {
                    Stepper("Duración: \(duration) día(s)", value: $duration, in: 1 ... 7)
                    Picker("Compañero", selection: $partnerA) {
                        Text("Elegí…").tag("")
                        ForEach(friends) { f in
                            Text(f.displayName).tag(f.id)
                        }
                    }
                    Button("Crear e invitar") { Task { await create() } }
                        .disabled(partnerA.isEmpty || busy)
                    if let lastCode {
                        Text("Código: \(lastCode)").font(.headline.monospaced())
                    }
                }
                Section("Unirse (equipo B)") {
                    TextField("Código 6 dígitos", text: $invite)
                        .keyboardType(.numberPad)
                    Picker("Compañero", selection: $partnerB) {
                        Text("Elegí…").tag("")
                        ForEach(friends) { f in
                            Text(f.displayName).tag(f.id)
                        }
                    }
                    Button("Unirse") { Task { await join() } }
                        .disabled(invite.count != 6 || partnerB.isEmpty || busy)
                }
                Section("Misión 2vs2") {
                    TextField("ID del duelo (copiar de la lista)", text: $duelIdField)
                        .font(.caption.monospaced())
                    Button("Generar misión competitiva") { Task { await genComp() } }
                        .disabled(duelIdField.isEmpty || busy)
                }
                if let msg { Section { Text(msg).font(.caption) } }
                Section("Tus duelos") {
                    ForEach(duels) { d in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(d.id).font(.caption2.monospaced()).lineLimit(2)
                            Text("\(d.status) · \(d.durationDays)d · \(d.teamAXp) vs \(d.teamBXp) XP")
                                .font(.caption)
                            if d.status == "ENDED" {
                                let w = d.winnerTeam == 0 ? "A" : d.winnerTeam == 1 ? "B" : "—"
                                Text("Ganador equipo \(w)").font(.caption2)
                            }
                            if let c = d.invitedCode6, d.status == "PENDING" {
                                Text("Invitación: \(c)").font(.caption.monospaced())
                            }
                        }
                    }
                }
            }
            .navigationTitle("2 vs 2")
            .task { await load() }
        }
    }

    private func load() async {
        do {
            duels = try await session.fetchDuels()
            friends = try await session.fetchFriends()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func create() async {
        busy = true
        defer { busy = false }
        do {
            let (_, code) = try await session.createDuel(durationDays: duration, partnerId: partnerA)
            lastCode = code
            msg = "Duelo creado"
            await load()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func join() async {
        busy = true
        defer { busy = false }
        do {
            try await session.joinDuel(code: invite, partnerId: partnerB)
            msg = "Duelo activo"
            invite = ""
            await load()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func genComp() async {
        busy = true
        defer { busy = false }
        do {
            _ = try await session.generateMission(context: "duelo 2vs2", urgent: false, explosive: false, duelId: duelIdField)
            msg = "Misión competitiva creada"
            await load()
        } catch {
            msg = error.localizedDescription
        }
    }
}
