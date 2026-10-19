import { useState, type ComponentProps } from "react";
import type { ComponentRegistry } from "../../runtime/rendering/ComponentRegistry";
import type {
  ComponentSchemaType,
  sharedComponents,
} from "../../components/registry";
import type { ValueChange } from "../../components/types";
import {
  navigationItems,
  listItems,
  reportFixture,
  userFixture,
} from "./fixtures";
import type { CatalogEntry } from "./types";

type PreviewProps = {
  [K in ComponentSchemaType]: ComponentProps<(typeof sharedComponents)[K]>;
};
interface CallbackEvent {
  id: number;
  name: string;
  payload: string;
}
export function ComponentPreview({
  entry,
  registry,
}: {
  entry: CatalogEntry;
  registry: ComponentRegistry;
}) {
  const [text, setText] = useState("Acme workspace");
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("finance");
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [selectedId, setSelectedId] = useState("overview");
  const [selectedRecord, setSelectedRecord] = useState("revenue");
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [horizontal, setHorizontal] = useState(false);
  const [variant, setVariant] = useState<"primary" | "secondary" | "ghost">(
    "primary",
  );
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(2);
  const [gap, setGap] = useState(16);
  const [events, setEvents] = useState<CallbackEvent[]>([]);
  const Component = registry.get(entry.type);
  const Card = registry.get("card");
  const Text = registry.get("text");
  const Button = registry.get("button");
  const Select = registry.get("select");
  const Checkbox = registry.get("checkbox");
  const PageHeader = registry.get("page-header");
  const record = (name: string, payload?: unknown) =>
    setEvents((previous) =>
      [
        {
          id: (previous[0]?.id ?? 0) + 1,
          name,
          payload:
            payload === undefined ? "No payload" : JSON.stringify(payload),
        },
        ...previous,
      ].slice(0, 5),
    );
  const infoCard = (
    <Card title="Team activity" description="A little context, at a glance.">
      <Text value="Your workspace is up to date." className="ui-muted" />
    </Card>
  );
  const metricCards = (
    <>
      <Card title="Revenue">
        <Text value="$128.4K" className="ui-metric-value" />
      </Card>
      <Card title="Growth">
        <Text value="+12.8%" className="ui-metric-value" />
      </Card>
    </>
  );
  const previews: PreviewProps = {
    button: {
      label: count ? `Saved (${count})` : "Save changes",
      variant,
      disabled,
      onClick: () => {
        setCount((previous) => previous + 1);
        record("onClick");
      },
    },
    "text-input": {
      label: "Workspace name",
      value: text,
      placeholder: "Enter a workspace name",
      disabled,
      onChange: (event) => {
        setText(event.value);
        record("onChange", event);
      },
    },
    "search-input": {
      label: "Search reports",
      value: query,
      placeholder: "Search reports…",
      disabled,
      onChange: (event) => {
        setQuery(event.value);
        record("onChange", event);
      },
      onSearch: (event) => record("onSearch", event),
    },
    select: {
      label: "Module",
      value: module,
      disabled,
      options: [
        { value: "finance", label: "Finance" },
        { value: "sales", label: "Sales" },
        { value: "marketing", label: "Marketing" },
      ],
      onChange: (event) => {
        setModule(event.value);
        record("onChange", event);
      },
    },
    switch: {
      label: "Email notifications",
      checked: enabled,
      disabled,
      onChange: (event) => {
        setEnabled(event.value);
        record("onChange", event);
      },
    },
    checkbox: {
      label: "Include archived records",
      checked,
      disabled,
      onChange: (event) => {
        setChecked(event.value);
        record("onChange", event);
      },
    },
    text: { value: "Your workspace is ready." },
    title: {
      value: "Workspace overview",
      level,
      subtitle: "Everything you need to move work forward.",
    },
    card: {
      title: "Team activity",
      description: "A little context, at a glance.",
      children: (
        <Text value="Your workspace is up to date." className="ui-muted" />
      ),
    },
    stack: { gap, children: metricCards },
    row: {
      gap,
      children: (
        <>
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => record("child.onClick", "cancel")}
          />
          <Button
            label="Save changes"
            onClick={() => record("child.onClick", "save")}
          />
        </>
      ),
    },
    page: {
      children: (
        <>
          <PageHeader
            title="Workspace"
            description="A place for your team’s work."
          />
          {infoCard}
        </>
      ),
    },
    "page-header": {
      title: "Reports",
      eyebrow: "Workspace",
      description: "A clearer picture of your business.",
      children: (
        <Button
          label="Create report"
          onClick={() => record("child.onClick", "create-report")}
        />
      ),
    },
    "split-layout": {
      ratio: "wide-left",
      gap,
      children: (
        <>
          <Card
            title="Main content"
            description="Room for the work that matters."
          >
            <Text value="Your primary view goes here." className="ui-muted" />
          </Card>
          <Card title="Details" description="The context alongside it.">
            <Text value="Additional information." className="ui-muted" />
          </Card>
        </>
      ),
    },
    "side-panel": {
      title: "Record details",
      description: "Revenue overview",
      open,
      onClose: () => {
        setOpen(false);
        record("onClose");
      },
      children: (
        <>
          <Text
            value="Monthly revenue and growth trends."
            className="ui-muted"
          />
          <dl className="catalog-sample-details">
            <div>
              <dt>Module</dt>
              <dd>Finance</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>Jamie Davis</dd>
            </div>
          </dl>
        </>
      ),
    },
    "generic-navigation": {
      items: navigationItems,
      selectedId,
      loading,
      orientation: horizontal ? "horizontal" : "vertical",
      label: "Preview navigation",
      onSelect: (event) => {
        setSelectedId(event.value);
        record("onSelect", event);
      },
    },
    "generic-list": {
      items: empty ? [] : listItems,
      selectedId: selectedRecord,
      loading,
      label: "Preview records",
      onSelect: (event) => {
        setSelectedRecord(event.value);
        record("onSelect", event);
      },
    },
    "report-card": {
      report: reportFixture,
      selected: selectedRecord === reportFixture.id,
      onOpen: (event) => {
        setSelectedRecord(event.value);
        record("onOpen", event);
      },
    },
    "user-card": {
      user: userFixture,
      selected: selectedId === userFixture.id,
      onSelect: (event) => {
        setSelectedId(event.value);
        record("onSelect", event);
      },
      onMessage: (event) => record("onMessage", event),
    },
  };
  const formTypes: ComponentSchemaType[] = [
    "button",
    "text-input",
    "search-input",
    "select",
    "switch",
    "checkbox",
  ];
  const layoutTypes: ComponentSchemaType[] = ["stack", "row", "split-layout"];
  const hasControls =
    formTypes.includes(entry.type) ||
    layoutTypes.includes(entry.type) ||
    ["title", "generic-navigation", "generic-list"].includes(entry.type);
  return (
    <>
      <div
        className={`catalog-preview-canvas preview-${entry.type}`}
        aria-label={`${entry.name} live preview`}
      >
        <Component {...previews[entry.type]} />
        {entry.type === "side-panel" && !open && (
          <p className="catalog-preview-empty">
            Panel closed. Reset the preview to open it again.
          </p>
        )}
      </div>
      {hasControls && (
        <div className="catalog-preview-controls">
          <span>PREVIEW CONTROLS</span>
          {formTypes.includes(entry.type) && (
            <Checkbox
              label="Disabled"
              checked={disabled}
              onChange={({ value }: ValueChange<boolean>) => setDisabled(value)}
            />
          )}
          {entry.type === "button" && (
            <Select
              label="Variant"
              value={variant}
              options={[
                { value: "primary", label: "Primary" },
                { value: "secondary", label: "Secondary" },
                { value: "ghost", label: "Ghost" },
              ]}
              onChange={({ value }: ValueChange<string>) => {
                if (
                  value === "primary" ||
                  value === "secondary" ||
                  value === "ghost"
                )
                  setVariant(value);
              }}
            />
          )}
          {entry.type === "title" && (
            <Select
              label="Heading level"
              value={String(level)}
              options={[1, 2, 3, 4].map((value) => ({
                value: String(value),
                label: `H${value}`,
              }))}
              onChange={({ value }: ValueChange<string>) => {
                const next = Number(value);
                if (next === 1 || next === 2 || next === 3 || next === 4)
                  setLevel(next);
              }}
            />
          )}
          {layoutTypes.includes(entry.type) && (
            <Select
              label="Gap"
              value={String(gap)}
              options={[8, 16, 24, 32].map((value) => ({
                value: String(value),
                label: `${value}px`,
              }))}
              onChange={({ value }: ValueChange<string>) =>
                setGap(Number(value))
              }
            />
          )}
          {["generic-navigation", "generic-list"].includes(entry.type) && (
            <Checkbox
              label="Loading"
              checked={loading}
              onChange={({ value }: ValueChange<boolean>) => setLoading(value)}
            />
          )}
          {entry.type === "generic-list" && (
            <Checkbox
              label="Empty list"
              checked={empty}
              onChange={({ value }: ValueChange<boolean>) => setEmpty(value)}
            />
          )}
          {entry.type === "generic-navigation" && (
            <Checkbox
              label="Horizontal"
              checked={horizontal}
              onChange={({ value }: ValueChange<boolean>) =>
                setHorizontal(value)
              }
            />
          )}
        </div>
      )}
      <div className="catalog-callback-log" aria-live="polite">
        <span>CALLBACK OUTPUT</span>
        {events.length ? (
          <ol>
            {events.map((event) => (
              <li key={event.id}>
                <code>{event.name}</code>
                <code>{event.payload}</code>
              </li>
            ))}
          </ol>
        ) : (
          <p>
            {Object.keys(entry.callbacks).length
              ? "Interact with the preview to see callback payloads."
              : "No callback props. This component composes or displays content."}
          </p>
        )}
      </div>
    </>
  );
}
