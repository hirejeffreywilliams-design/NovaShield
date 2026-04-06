import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import {
  BookOpen,
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  Car,
  Footprints,
  Camera,
  Home,
  HandMetal,
  Siren,
  Megaphone,
  CarFront,
  Send,
  Loader2,
  Info,
  MapPin,
} from "lucide-react";

interface RightsScenario {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rights: string[];
  tips: string[];
}

const scenarios: RightsScenario[] = [
  {
    id: "traffic-stop",
    title: "Traffic Stop",
    icon: Car,
    rights: [
      "You must provide license, registration, and proof of insurance.",
      "You have the right to remain silent beyond identifying yourself.",
      "You do NOT have to consent to a search of your vehicle.",
      "You can refuse to exit the vehicle unless the officer has reasonable suspicion.",
      "You have the right to record the interaction.",
    ],
    tips: [
      "Keep your hands visible on the steering wheel.",
      "Inform the officer if you have a legal firearm in the vehicle.",
      "If you refuse a search, state it clearly and calmly.",
      "Ask 'Am I free to go?' if the stop feels prolonged.",
      "Do not reach for anything until instructed to do so.",
    ],
  },
  {
    id: "pedestrian-stop",
    title: "Pedestrian Stop",
    icon: Footprints,
    rights: [
      "In most states, you must identify yourself if asked (stop-and-identify laws vary by state).",
      "You have the right to ask if you are being detained or free to go.",
      "You can refuse a pat-down unless the officer has reasonable suspicion you are armed.",
      "You do not have to answer questions beyond identification.",
      "You have the right to walk away if not being detained.",
    ],
    tips: [
      "Stay calm and keep your hands visible.",
      "Clearly ask: 'Am I being detained or am I free to go?'",
      "Do not physically resist even if you believe the stop is unlawful.",
      "Remember badge numbers and details for later reporting.",
    ],
  },
  {
    id: "recording-police",
    title: "Recording Police",
    icon: Camera,
    rights: [
      "You have a First Amendment right to record police in public spaces.",
      "Officers cannot demand you delete footage or seize your device without a warrant.",
      "You can record from any public area where you are legally allowed to be.",
      "Recording does not constitute interference with police duties.",
    ],
    tips: [
      "Keep a safe distance and do not physically interfere.",
      "Use cloud backup so footage is preserved even if your phone is seized.",
      "Announce that you are recording if you feel safe doing so.",
      "If told to stop recording, calmly state your right to record in public.",
    ],
  },
  {
    id: "home-entry",
    title: "Home Entry",
    icon: Home,
    rights: [
      "Police generally need a warrant to enter your home.",
      "You do NOT have to open the door or let officers inside without a warrant.",
      "You can ask to see the warrant through a window or under the door.",
      "Exceptions: exigent circumstances, hot pursuit, consent, or plain-view doctrine.",
      "Even with a warrant, you can observe and take notes.",
    ],
    tips: [
      "Step outside and close the door behind you if you choose to speak with officers.",
      "Ask to see and read the warrant before allowing entry.",
      "Note the scope of the warrant - officers can only search where the warrant specifies.",
      "Do not physically block entry if they have a valid warrant.",
    ],
  },
  {
    id: "arrest",
    title: "Arrest",
    icon: HandMetal,
    rights: [
      "You have the right to remain silent (Miranda rights).",
      "You have the right to an attorney. If you cannot afford one, one will be appointed.",
      "You have the right to know why you are being arrested.",
      "You can refuse to sign anything without an attorney present.",
      "You have the right to make a phone call within a reasonable time.",
    ],
    tips: [
      "State clearly: 'I invoke my right to remain silent' and 'I want a lawyer.'",
      "Do not resist arrest even if you believe it is unlawful.",
      "Remember everything: time, location, officers involved, witnesses.",
      "Do not consent to any searches.",
    ],
  },
  {
    id: "use-of-force",
    title: "Use of Force",
    icon: Siren,
    rights: [
      "Officers may only use force that is 'objectively reasonable' under the circumstances.",
      "Excessive force violates the Fourth Amendment.",
      "You have the right to file a complaint and seek medical attention.",
      "Witnesses have the right to record and report excessive force.",
    ],
    tips: [
      "Do not resist - it can escalate the situation and be used against you.",
      "Verbally express compliance: 'I am not resisting.'",
      "Seek medical attention immediately and document all injuries.",
      "File a complaint with Internal Affairs and the civilian review board.",
    ],
  },
  {
    id: "protest-rights",
    title: "Protest Rights",
    icon: Megaphone,
    rights: [
      "The First Amendment protects your right to peaceful assembly and protest.",
      "You can protest on public sidewalks, parks, and plazas without a permit.",
      "Counter-protesters have the same rights you do.",
      "Police cannot disperse a peaceful protest without lawful reason.",
      "You have the right to record police actions during protests.",
    ],
    tips: [
      "Write the number of a legal observer or attorney on your arm.",
      "Bring water, ID, and a charged phone with cloud backup enabled.",
      "Stay aware of your surroundings and have an exit plan.",
      "If arrested, give only your name and state you wish to remain silent.",
    ],
  },
  {
    id: "vehicle-search",
    title: "Vehicle Search",
    icon: CarFront,
    rights: [
      "Officers need probable cause, a warrant, or your consent to search your vehicle.",
      "You can clearly and calmly refuse consent: 'I do not consent to a search.'",
      "If you are arrested, police can search the passenger area incident to arrest.",
      "Your trunk generally requires a warrant or probable cause.",
      "Drug-sniffing dogs cannot unreasonably extend a traffic stop.",
    ],
    tips: [
      "Always state refusal clearly: 'I do not consent to a search.'",
      "Do not physically interfere if they search anyway.",
      "Ask for badge numbers and document everything.",
      "A search conducted without consent or probable cause can be challenged in court.",
    ],
  },
];

const stateResources: Record<string, { name: string; legalAid: string; aclu: string }> = {
  CA: { name: "California", legalAid: "https://www.lawhelpca.org", aclu: "https://www.aclunc.org" },
  NY: { name: "New York", legalAid: "https://www.lawhelpny.org", aclu: "https://www.nyclu.org" },
  TX: { name: "Texas", legalAid: "https://www.texaslawhelp.org", aclu: "https://www.aclutx.org" },
  FL: { name: "Florida", legalAid: "https://www.floridalegal.org", aclu: "https://www.aclufl.org" },
  IL: { name: "Illinois", legalAid: "https://www.illinoislegalaid.org", aclu: "https://www.aclu-il.org" },
  PA: { name: "Pennsylvania", legalAid: "https://www.palegalaid.net", aclu: "https://www.aclupa.org" },
  OH: { name: "Ohio", legalAid: "https://www.ohiolegalhelp.org", aclu: "https://www.acluohio.org" },
  GA: { name: "Georgia", legalAid: "https://www.georgialegalaid.org", aclu: "https://www.acluga.org" },
};

const resourceLinks = [
  { name: "ACLU - Know Your Rights", url: "https://www.aclu.org/know-your-rights" },
  { name: "National Legal Aid & Defender Association", url: "https://www.nlada.org" },
  { name: "National Police Accountability Project", url: "https://www.nlg-npap.org" },
  { name: "Copwatch", url: "https://copwatch.org" },
  { name: "Flex Your Rights", url: "https://www.flexyourrights.org" },
];

export default function RightsPage() {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState("");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    setAiAnswer("");

    try {
      const result = await apiPost<{ answer: string }>("/rights/ask", { question: question.trim() });
      setAiAnswer(result.answer);
    } catch {
      // Fallback answer for demo
      setAiAnswer(
        "Based on established constitutional law, your rights depend on the specific circumstances of the interaction. " +
        "Generally, you always have the right to remain silent (Fifth Amendment), the right to refuse unreasonable " +
        "searches (Fourth Amendment), and the right to record police in public spaces (First Amendment). " +
        "For specific legal advice about your situation, please consult with a qualified attorney in your jurisdiction. " +
        "You can find free legal aid resources in the links section below."
      );
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
          <BookOpen className="h-5 w-5 text-[#0EA5E9]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Know Your Rights</h1>
          <p className="text-sm text-[#a3a3a3]">Understanding your constitutional rights during police encounters</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
        <div>
          <p className="text-sm font-medium text-yellow-400">Educational Information Only - Not Legal Advice</p>
          <p className="mt-1 text-xs leading-relaxed text-[#a3a3a3]">
            The information provided here is for educational purposes only and should not be considered legal advice.
            Laws vary by state and jurisdiction. For specific legal situations, always consult with a qualified attorney.
          </p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#e5e5e5]">Common Scenarios</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((scenario) => {
            const isExpanded = expandedScenario === scenario.id;
            return (
              <div
                key={scenario.id}
                className={`rounded-lg border bg-[#111111] transition-all ${
                  isExpanded ? "border-[#0EA5E9]/30 sm:col-span-2 lg:col-span-4" : "border-[#1e1e1e] hover:border-[#2a2a2a]"
                }`}
              >
                <button
                  onClick={() => setExpandedScenario(isExpanded ? null : scenario.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
                    <scenario.icon className="h-5 w-5 text-[#0EA5E9]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#e5e5e5]">{scenario.title}</span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#525252]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#525252]" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-[#1e1e1e] px-4 pb-5 pt-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0EA5E9]">
                          <Shield className="h-4 w-4" />
                          Your Rights
                        </h4>
                        <ul className="space-y-2">
                          {scenario.rights.map((right, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#a3a3a3]">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0EA5E9]" />
                              {right}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#06B6D4]">
                          <Info className="h-4 w-4" />
                          Tips
                        </h4>
                        <ul className="space-y-2">
                          {scenario.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#a3a3a3]">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#06B6D4]" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ask a Rights Question */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#e5e5e5]">Ask a Rights Question</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
            placeholder="e.g., Can police search my phone without a warrant?"
            className="flex-1 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5 text-sm text-[#e5e5e5] placeholder-[#525252] focus:border-[#0EA5E9] focus:outline-none"
          />
          <button
            onClick={handleAskQuestion}
            disabled={!question.trim() || isAsking}
            className="flex items-center gap-2 rounded-lg bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0EA5E9]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </button>
        </div>
        {aiAnswer && (
          <div className="mt-4 rounded-lg border border-[#0EA5E9]/20 bg-[#0EA5E9]/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#0EA5E9]">
              <Shield className="h-3.5 w-3.5" />
              AI-Powered Answer
            </div>
            <p className="text-sm leading-relaxed text-[#a3a3a3]">{aiAnswer}</p>
            <p className="mt-3 text-xs italic text-[#525252]">
              This is AI-generated educational information, not legal advice. Consult an attorney for your specific situation.
            </p>
          </div>
        )}
      </div>

      {/* State-Specific Resources */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#e5e5e5]">
          <MapPin className="h-5 w-5 text-[#0EA5E9]" />
          State-Specific Resources
        </h2>
        <div className="mb-4">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] px-3 py-2.5 text-sm text-[#e5e5e5] focus:border-[#0EA5E9] focus:outline-none sm:w-64"
          >
            <option value="">Select your state...</option>
            {Object.entries(stateResources).map(([code, info]) => (
              <option key={code} value={code}>
                {info.name}
              </option>
            ))}
          </select>
        </div>
        {selectedState && stateResources[selectedState] && (
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={stateResources[selectedState].legalAid}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4 transition-colors hover:border-[#0EA5E9]/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-400/10">
                <Shield className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#e5e5e5]">{stateResources[selectedState].name} Legal Aid</p>
                <p className="text-xs text-[#525252]">Free legal assistance</p>
              </div>
              <ExternalLink className="h-4 w-4 text-[#525252]" />
            </a>
            <a
              href={stateResources[selectedState].aclu}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-4 transition-colors hover:border-[#0EA5E9]/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/10">
                <BookOpen className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#e5e5e5]">{stateResources[selectedState].name} ACLU</p>
                <p className="text-xs text-[#525252]">Civil liberties organization</p>
              </div>
              <ExternalLink className="h-4 w-4 text-[#525252]" />
            </a>
          </div>
        )}
        {!selectedState && (
          <p className="text-sm text-[#525252]">Select a state to see local legal resources.</p>
        )}
      </div>

      {/* General Resource Links */}
      <div className="rounded-lg border border-[#1e1e1e] bg-[#111111] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#e5e5e5]">National Resources</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resourceLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-3 text-sm text-[#a3a3a3] transition-colors hover:border-[#0EA5E9]/30 hover:text-[#0EA5E9]"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span>{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
