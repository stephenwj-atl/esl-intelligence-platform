import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateProject,
  CreateProjectInputProjectType,
  CreateProjectInputProjectCategory,
  CreateProjectInputInterventionType,
  CreateProjectInputLenderFramework,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, AnimatedContainer } from "@/components/ui";
import { ShieldAlert, Database, MapPin, Activity, Save, Loader2, DollarSign, Layers, Target, Building2, FileCheck } from "lucide-react";

const CATEGORY_TYPES: Record<string, string[]> = {
  "Hard Infrastructure": ["Solar", "Wind", "Geothermal", "Port", "Road", "Bridge", "Dam", "Power Plant", "Water Treatment"],
  "Soft Infrastructure": ["Hotel", "Hospital", "School", "Housing", "Community Centre", "Market"],
  "Climate & Environment": ["Mangrove Restoration", "Coral Reef Protection", "Watershed Management", "Forest Conservation", "Carbon Sequestration"],
  "Agriculture & Food Security": ["Agriculture", "Aquaculture", "Irrigation", "Food Processing", "Cold Chain"],
  "Governance & Institutional": ["Regulatory Capacity", "Environmental Agency", "Land Registry", "Monitoring Network"],
  "Disaster Response & Recovery": ["Emergency Shelter", "Early Warning System", "Debris Management", "Infrastructure Repair"],
};

const CATEGORY_INTERVENTION_MAP: Record<string, string> = {
  "Hard Infrastructure": "Physical Infrastructure",
  "Soft Infrastructure": "Social/Programmatic",
  "Climate & Environment": "Environmental",
  "Agriculture & Food Security": "Physical Infrastructure",
  "Governance & Institutional": "Governance",
  "Disaster Response & Recovery": "Disaster",
};

const CARIBBEAN_COUNTRIES = [
  "Jamaica", "Dominican Republic", "Trinidad & Tobago", "Barbados", "Bahamas",
  "Guyana", "Suriname", "Haiti", "Cuba", "Puerto Rico", "Cayman Islands",
  "Belize", "St. Lucia", "Grenada", "Antigua & Barbuda", "St. Vincent & the Grenadines", "Dominica",
];

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  country: z.string().min(2, "Country is required"),
  projectCategory: z.string().optional(),
  projectType: z.string(),
  interventionType: z.string().optional(),
  lenderFramework: z.string().optional().transform(v => v === "" ? undefined : v),
  investmentAmount: z.coerce.number().min(0.1, "Investment amount is required"),
  latitude: z.string().optional().transform(v => v && v !== "" ? parseFloat(v) : undefined),
  longitude: z.string().optional().transform(v => v && v !== "" ? parseFloat(v) : undefined),
  floodRisk: z.coerce.number().min(0).max(10),
  coastalExposure: z.coerce.number().min(0).max(10),
  contaminationRisk: z.coerce.number().min(0).max(10),
  regulatoryComplexity: z.coerce.number().min(0).max(10),
  communitySensitivity: z.coerce.number().min(0).max(10),
  waterStress: z.coerce.number().min(0).max(10),
  hasLabData: z.boolean().default(false),
  hasMonitoringData: z.boolean().default(false),
  isIFCAligned: z.boolean().default(false),
  hasSEA: z.boolean().default(false),
  hasESIA: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { mutate: createProject, isPending } = useCreateProject();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: "Jamaica",
      projectCategory: "Hard Infrastructure",
      projectType: "Solar",
      interventionType: "Physical Infrastructure",
      investmentAmount: 10,
      floodRisk: 5,
      coastalExposure: 5,
      contaminationRisk: 5,
      regulatoryComplexity: 5,
      communitySensitivity: 5,
      waterStress: 5,
      hasLabData: false,
      hasMonitoringData: false,
      isIFCAligned: false,
      hasSEA: false,
      hasESIA: false,
    }
  });

  const selectedCategory = watch("projectCategory") || "Hard Infrastructure";
  const availableTypes = CATEGORY_TYPES[selectedCategory] || [];

  const onSubmit = (data: FormData) => {
    createProject({ data: data as any }, {
      onSuccess: (result: any) => {
        setLocation(`/project/${result.id}`);
      }
    });
  };

  const handleCategoryChange = (category: string) => {
    setValue("projectCategory", category);
    const types = CATEGORY_TYPES[category] || [];
    if (types.length > 0) {
      setValue("projectType", types[0]);
    }
    const intervention = CATEGORY_INTERVENTION_MAP[category];
    if (intervention) {
      setValue("interventionType", intervention);
    }
  };

  const RangeSlider = ({ name, label, control: ctrl }: { name: keyof FormData, label: string, control: any }) => {
    const value = watch(name) as number;
    const getColor = (v: number) => {
      if (v <= 3) return "text-green-400";
      if (v <= 6) return "text-yellow-400";
      return "text-red-400";
    };
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-foreground/80">{label}</Label>
          <span className={`text-xs font-mono font-bold px-2 py-1 bg-secondary rounded ${getColor(value)}`}>{value}/10</span>
        </div>
        <Controller
          name={name}
          control={ctrl}
          render={({ field }) => (
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              {...field}
              className="w-full"
            />
          )}
        />
      </div>
    );
  };

  const Toggle = ({ name, label, description, control: ctrl, icon }: { name: keyof FormData, label: string, description: string, control: any, icon?: React.ReactNode }) => (
    <Controller
      name={name}
      control={ctrl}
      render={({ field: { value, onChange } }) => (
        <div
          className={`flex items-start space-x-4 p-4 rounded-xl border transition-all cursor-pointer ${value ? 'bg-primary/10 border-primary/30' : 'bg-background border-border/50 hover:bg-secondary/50'}`}
          onClick={() => onChange(!value)}
        >
          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${value ? 'bg-primary border-primary text-primary-foreground' : 'bg-transparent border-muted-foreground'}`}>
            {value && (icon || <ShieldAlert className="w-3 h-3" />)}
          </div>
          <div>
            <Label className="text-sm font-semibold cursor-pointer">{label}</Label>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      )}
    />
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">New Project Assessment</h1>
          <p className="text-muted-foreground mt-2">Configure project parameters for PERS analysis, capital mode recommendation, and monitoring intensity assessment.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <AnimatedContainer delay={0.1}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center text-foreground border-b border-border/50 pb-4">
                <MapPin className="w-5 h-5 mr-2 text-primary" /> Project Identification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Project Name</Label>
                  <Input {...register("name")} placeholder="e.g. Kingston Solar Array Phase II" className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <select
                    {...register("country")}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    {CARIBBEAN_COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-muted-foreground"/> Investment ($M)</Label>
                  <Input type="number" step="0.1" {...register("investmentAmount")} min="0.1" className={errors.investmentAmount ? "border-destructive" : ""} />
                  {errors.investmentAmount && <p className="text-xs text-destructive">{errors.investmentAmount.message as string}</p>}
                </div>
              </div>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.15}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center text-foreground border-b border-border/50 pb-4">
                <Layers className="w-5 h-5 mr-2 text-primary" /> Project Classification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Project Category</Label>
                  <Controller
                    name="projectCategory"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          handleCategoryChange(e.target.value);
                        }}
                        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      >
                        {Object.keys(CATEGORY_TYPES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <select
                    {...register("projectType")}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    {availableTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Intervention Type</Label>
                  <select
                    {...register("interventionType")}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    <option value="Physical Infrastructure">Physical Infrastructure</option>
                    <option value="Social/Programmatic">Social / Programmatic</option>
                    <option value="Environmental">Environmental</option>
                    <option value="Governance">Governance</option>
                    <option value="Disaster">Disaster</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Lender Framework (optional)</Label>
                  <select
                    {...register("lenderFramework")}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  >
                    <option value="">None selected</option>
                    <option value="IDB ESPF">IDB ESPF</option>
                    <option value="CDB ESRP">CDB ESRP</option>
                    <option value="World Bank ESF">World Bank ESF</option>
                    <option value="GCF">GCF</option>
                    <option value="EIB">EIB</option>
                    <option value="Equator Principles">Equator Principles</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Latitude (optional)</Label>
                  <Input type="number" step="0.0001" {...register("latitude")} placeholder="e.g. 18.0179" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude (optional)</Label>
                  <Input type="number" step="0.0001" {...register("longitude")} placeholder="e.g. -76.8099" />
                </div>
              </div>
            </Card>
          </AnimatedContainer>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatedContainer delay={0.2}>
              <Card className="p-6 h-full">
                <h2 className="text-lg font-semibold mb-6 flex items-center text-foreground border-b border-border/50 pb-4">
                  <Activity className="w-5 h-5 mr-2 text-primary" /> Environmental Risk Factors
                </h2>
                <div className="space-y-8">
                  <RangeSlider name="floodRisk" label="Flood & Climate Risk" control={control} />
                  <RangeSlider name="coastalExposure" label="Coastal Exposure" control={control} />
                  <RangeSlider name="contaminationRisk" label="Historical Contamination" control={control} />
                  <RangeSlider name="waterStress" label="Water Stress Area" control={control} />
                  <RangeSlider name="regulatoryComplexity" label="Regulatory Complexity" control={control} />
                  <RangeSlider name="communitySensitivity" label="Community Sensitivity" control={control} />
                </div>
              </Card>
            </AnimatedContainer>

            <AnimatedContainer delay={0.3} className="space-y-8">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center text-foreground border-b border-border/50 pb-4">
                  <Database className="w-5 h-5 mr-2 text-primary" /> Data Confidence & Standards
                </h2>
                <div className="space-y-4">
                  <Toggle
                    name="hasLabData"
                    label="Independent Lab Validation"
                    description="Project includes certified environmental laboratory sampling data."
                    control={control}
                  />
                  <Toggle
                    name="hasMonitoringData"
                    label="Historical Monitoring"
                    description="Includes 12+ months of baseline environmental monitoring."
                    control={control}
                  />
                  <Toggle
                    name="isIFCAligned"
                    label="IFC Performance Standards"
                    description="Designed in alignment with World Bank / IFC environmental standards."
                    control={control}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center text-foreground border-b border-border/50 pb-4">
                  <FileCheck className="w-5 h-5 mr-2 text-primary" /> Environmental Assessment Instruments
                </h2>
                <div className="space-y-4">
                  <Toggle
                    name="hasSEA"
                    label="Strategic Environmental Assessment (SEA)"
                    description="SEA framework exists for this sector/region. Reduces regulatory risk overlay by 15%. SEA is a primary investment guidance tool."
                    control={control}
                    icon={<Target className="w-3 h-3" />}
                  />
                  <Toggle
                    name="hasESIA"
                    label="Environmental & Social Impact Assessment (ESIA)"
                    description="ESIA completed for this project. Reduces project overlay by 10%. ESIA is the primary project-level assessment tool."
                    control={control}
                    icon={<FileCheck className="w-3 h-3" />}
                  />
                  <p className="text-xs text-muted-foreground/70 italic px-1">
                    Note: EIA is permitting compliance only. SEA and ESIA are the primary investment guidance instruments.
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-primary" /> Ready for PERS Analysis
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  The ESL Intelligence Engine will compute the Project Environmental Risk Score (PERS), determine capital mode (Loan/Blended/Grant), set monitoring intensity, and generate intervention risk profile.
                </p>
                <Button type="submit" className="w-full py-6 text-base shadow-lg shadow-primary/20" disabled={isPending}>
                  {isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Computing PERS Assessment...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> Generate PERS Intelligence Report</>
                  )}
                </Button>
              </Card>
            </AnimatedContainer>
          </div>
        </form>
      </div>
    </Layout>
  );
}
