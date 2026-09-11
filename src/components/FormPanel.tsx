import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { WorkflowActions } from "@/hooks/useWorkflow";
import type { SectionCheck } from "@/lib/checks";
import { TRIGGER_TYPES, type ListKey } from "@/lib/types";
import { DataEditor } from "./editors/DataEditor";
import { InputsEditor } from "./editors/InputsEditor";
import { LinksEditor } from "./editors/LinksEditor";
import { OutputsEditor } from "./editors/OutputsEditor";
import { StepsEditor } from "./editors/StepsEditor";
import { ProgressNav } from "./ProgressNav";
import { StepSection } from "./StepSection";

type Props = { actions: WorkflowActions; checks: SectionCheck[] };

export function FormPanel({ actions, checks }: Props) {
  const { workflow, setText, addItem } = actions;
  const editorProps = { workflow, updateItem: actions.updateItem, removeItem: actions.removeItem };
  const addButton = (key: ListKey, label: string) => (
    <Button size="sm" onClick={() => addItem(key)}>
      + {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3.5">
      <ProgressNav checks={checks} />

      <StepSection
        id="formaal"
        eyebrow="Formål"
        title="Hva skal flyten oppnå?"
        why="Claude bygger det du beskriver, ikke det du mener. Skriv derfor problemet slik en kollega ville forklart det, ikke løsningen."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="navn" label="Navn på flyten">
            <Input id="navn" placeholder="F.eks. Tilbudsforespørsel" value={workflow.navn} onChange={(e) => setText("navn", e.target.value)} />
          </Field>
          <Field id="eier" label="Hvem eier flyten hos oss?">
            <Input id="eier" placeholder="Rolle, f.eks. salgsansvarlig" value={workflow.eier} onChange={(e) => setText("eier", e.target.value)} />
          </Field>
        </div>
        <Field id="problem" label="Problemet i dag">
          <Textarea
            id="problem"
            placeholder="Hva gjøres manuelt, hva går galt, hva koster det oss?"
            value={workflow.problem}
            onChange={(e) => setText("problem", e.target.value)}
          />
        </Field>
        <Field id="suksess" label="Slik vet vi at det virker" hint="Dette blir akseptansekriteriene i briefen. Ett kriterium per linje.">
          <Textarea
            id="suksess"
            placeholder="Ett til tre målbare tegn. F.eks. «svar til kunde innen 24 timer»"
            value={workflow.suksess}
            onChange={(e) => setText("suksess", e.target.value)}
          />
        </Field>
      </StepSection>

      <StepSection
        id="aktorer"
        eyebrow="Aktører og start"
        title="Hvem bruker den, og hva setter den i gang?"
        why="En flyt har alltid en trigger. Uten den vet ikke Claude om dette er et skjema, en knapp, en e-post som kommer inn eller en jobb som kjører hver natt."
      >
        <Field id="brukere" label="Brukere og roller" hint="Én per linje. Ta med om de er interne eller eksterne, og om de må logge inn.">
          <Textarea
            id="brukere"
            placeholder={"Kunde, ekstern, uten innlogging\nKonsulent, intern, innlogget"}
            value={workflow.brukere}
            onChange={(e) => setText("brukere", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="triggerType" label="Type trigger">
            <Select
              id="triggerType"
              options={TRIGGER_TYPES}
              value={workflow.triggerType}
              onChange={(e) => setText("triggerType", e.target.value)}
            />
          </Field>
          <Field id="trigger" label="Beskriv triggeren">
            <Input
              id="trigger"
              placeholder="F.eks. kunden sender inn konfigurator-skjemaet"
              value={workflow.trigger}
              onChange={(e) => setText("trigger", e.target.value)}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection
        id="inputs"
        eyebrow="Inputs"
        title="Hva kommer inn?"
        why="Hvert felt Claude skal lage må ha navn, type og hvor det kommer fra. Merk hva som er påkrevd, ellers blir alt valgfritt."
        action={addButton("inputs", "Legg til input")}
      >
        <InputsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="data"
        eyebrow="Data"
        title="Hva må lagres, og hvem eier det?"
        why="Dette blir datamodellen. Tenk «ting» (en forespørsel, et tilbud, en kunde), ikke skjermbilder. Hvem som eier dataene styrer hvem som får se det."
        action={addButton("data", "Legg til datatype")}
      >
        <DataEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="steg"
        eyebrow="Steg og regler"
        title="Hva skjer, i rekkefølge?"
        why="Ett steg per linje i flyten. Regler er der det er «hvis … så …». Det er reglene som oftest mangler når en MVP blir feil."
        action={addButton("steg", "Legg til steg")}
      >
        <StepsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="outputs"
        eyebrow="Outputs"
        title="Hva kommer ut, til hvem?"
        why="En e-post, en PDF, en rad i et regneark, en side i appen. Uten mottaker og kanal blir outputen bare «vis noe på skjermen»."
        action={addButton("outputs", "Legg til output")}
      >
        <OutputsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="koblinger"
        eyebrow="Koblinger"
        title="Hva henger den sammen med?"
        why="Andre flyter og apper vi har laget, eller systemer vi bruker. Retning betyr: henter vi data derfra, sender vi dit, eller begge deler?"
        action={addButton("koblinger", "Legg til kobling")}
      >
        <LinksEditor {...editorProps} />
        <Field id="avgrensning" label="Utenfor scope i MVP" hint="Det dere bevisst ikke tar med nå. Hindrer at Claude bygger for mye.">
          <Textarea
            id="avgrensning"
            placeholder="F.eks. ingen e-signering, ingen integrasjon mot regnskap"
            value={workflow.avgrensning}
            onChange={(e) => setText("avgrensning", e.target.value)}
          />
        </Field>
      </StepSection>
    </div>
  );
}
