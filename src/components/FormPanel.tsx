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

type Props = { actions: WorkflowActions; checks: SectionCheck[]; onStartOwn: () => void };

export function FormPanel({ actions, checks, onStartOwn }: Props) {
  const { workflow, storage, setText, addItem } = actions;
  const editorProps = { workflow, updateItem: actions.updateItem, removeItem: actions.removeItem };
  const addButton = (key: ListKey, label: string) => (
    <Button size="sm" onClick={() => addItem(key)}>
      + {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3.5">
      {storage.loadError && (
        <p role="alert" className="m-0 rounded-md border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          Det som lå lagret i denne nettleseren kunne ikke leses. {storage.loadError} Vi har tatt vare på en kopi som du
          finner under fanen «Lagret data (JSON)». Det du gjør nå erstatter ikke kopien.
        </p>
      )}
      {storage.saveFailed && (
        <p role="alert" className="m-0 rounded-md border border-warning bg-warning-soft px-3 py-2 text-sm text-warning">
          Nettleseren lar oss ikke lagre. Kopier innholdet i fanen «Lagret data (JSON)» før du lukker siden.
        </p>
      )}
      {workflow.eksempel && (
        <div className="flex flex-col gap-3 rounded-md border border-primary bg-primary-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-sm text-foreground">
            <strong>Dette er et eksempel.</strong> Les gjennom det for å se hvor konkret du bør være, og start din egen flyt når du er klar.
          </p>
          <Button variant="primary" size="sm" onClick={onStartOwn}>
            Start egen flyt
          </Button>
        </div>
      )}

      <ProgressNav checks={checks} />

      <StepSection
        id="formaal"
        eyebrow="Formål"
        title="Hva skal flyten oppnå?"
        why="Claude bygger det du beskriver, ikke det du mener. Skriv derfor problemet slik du ville forklart det til en kollega, ikke løsningen."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="navn" label="Navn på flyten">
            <Input id="navn" placeholder="F.eks. Tilbudsforespørsel" value={workflow.navn} onChange={(e) => setText("navn", e.target.value)} />
          </Field>
          <Field id="eier" label="Hvem eier flyten hos dere?">
            <Input id="eier" placeholder="Rolle, f.eks. salgsansvarlig" value={workflow.eier} onChange={(e) => setText("eier", e.target.value)} />
          </Field>
        </div>
        <Field id="problem" label="Problemet i dag">
          <Textarea
            id="problem"
            placeholder="Hva gjøres manuelt, hva går galt, hva koster det dere?"
            value={workflow.problem}
            onChange={(e) => setText("problem", e.target.value)}
          />
        </Field>
        <Field
          id="suksess"
          label="Slik vet dere at det virker"
          hint="Ett kriterium per linje, som en kollega kan svare ja eller nei på. Mal: «Gitt … når … så …». Claude lager én test per linje."
        >
          <Textarea
            id="suksess"
            placeholder="F.eks. Gitt at kunden har sendt inn skjemaet, når det er lagret, så har kunden fått bekreftelse innen ett minutt."
            value={workflow.suksess}
            onChange={(e) => setText("suksess", e.target.value)}
          />
        </Field>
      </StepSection>

      <StepSection
        id="aktorer"
        eyebrow="Hvem og hva starter det"
        title="Hvem bruker den, og hva setter den i gang?"
        why="En flyt har alltid noe som starter den. Uten det vet ikke Claude om dette er et skjema, en knapp, en e-post som kommer inn eller en jobb som kjører hver natt."
      >
        <Field
          id="brukere"
          label="Brukere og roller"
          hint="Én per linje: rolle, intern eller ekstern, må logge inn eller ikke, og hva de ser og kan endre. Ta også med hvem som ikke skal se dette."
        >
          <Textarea
            id="brukere"
            placeholder={"Kunde, ekstern, uten innlogging, ser bare sitt eget skjema\nKonsulent, intern, innlogget, ser alt men endrer ingenting"}
            value={workflow.brukere}
            onChange={(e) => setText("brukere", e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="triggerType" label="Hva starter flyten?">
            <Select id="triggerType" options={TRIGGER_TYPES} value={workflow.triggerType} onValueChange={(v) => setText("triggerType", v)} />
          </Field>
          <Field id="trigger" label="Beskriv starten">
            <Input
              id="trigger"
              placeholder="F.eks. kunden trykker «Be om tilbud» i portalen"
              value={workflow.trigger}
              onChange={(e) => setText("trigger", e.target.value)}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection
        id="inputs"
        eyebrow="Det som kommer inn"
        title="Hva kommer inn?"
        why="Hvert felt Claude skal lage må ha navn, type og hvor det kommer fra. Merk hva som må fylles ut, ellers blir alt valgfritt."
        action={addButton("inputs", "Legg til felt")}
      >
        <InputsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="data"
        eyebrow="Det som lagres"
        title="Hva må huskes, og hvem eier det?"
        why="Tenk «ting» (en forespørsel, et tilbud, en kunde), ikke skjermbilder. Hvem som eier dataene styrer hvem som får se dem. Har tingen en status, er rekkefølgen og hvem som kan flytte den det Claude oftest bygger feil."
        action={addButton("data", "Legg til noe som lagres")}
      >
        <DataEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="steg"
        eyebrow="Steg og regler"
        title="Hva skjer, i rekkefølge?"
        why="Ett steg per linje i flyten. Regler er der det er «når … skal …». Skriv gjerne et eksempel med tall. Og spør deg selv for hvert steg: hva gjør dere i dag når det ikke går?"
        action={addButton("steg", "Legg til steg")}
      >
        <StepsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="outputs"
        eyebrow="Det som kommer ut"
        title="Hva kommer ut, til hvem?"
        why="En e-post, en PDF, en rad i et regneark, en side i appen. Uten mottaker og kanal blir det bare «vis noe på skjermen»."
        action={addButton("outputs", "Legg til resultat")}
      >
        <OutputsEditor {...editorProps} />
      </StepSection>

      <StepSection
        id="koblinger"
        eyebrow="Koblinger og grenser"
        title="Hva henger den sammen med, og hva tar dere ikke med?"
        why="Andre flyter og apper dere har laget, eller systemer dere bruker. Claude får beskjed om at disse ikke skal endres, bare brukes slik du beskriver."
        action={addButton("koblinger", "Legg til kobling")}
      >
        <LinksEditor {...editorProps} />
        <Field id="avgrensning" label="Det dere ikke tar med i første versjon" hint="Hindrer at Claude bygger for mye.">
          <Textarea
            id="avgrensning"
            placeholder="F.eks. ingen e-signering, ingen integrasjon mot regnskap"
            value={workflow.avgrensning}
            onChange={(e) => setText("avgrensning", e.target.value)}
          />
        </Field>
        <Field id="ukjent" label="Det dere ikke vet ennå" hint="Ett spørsmål per linje. Claude spør om disse i stedet for å gjette.">
          <Textarea
            id="ukjent"
            placeholder="F.eks. Skal konsulenter kunne skrive notater, eller bare lese?"
            value={workflow.ukjent}
            onChange={(e) => setText("ukjent", e.target.value)}
          />
        </Field>
      </StepSection>
    </div>
  );
}
