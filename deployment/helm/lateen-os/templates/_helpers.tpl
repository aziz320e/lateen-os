{{/*
Lateen OS Helm helpers
*/}}
{{- define "lateen.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "lateen.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "lateen.labels" -}}
helm.sh/chart: {{ include "lateen.fullname" . }}
app.kubernetes.io/name: {{ include "lateen.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
lateen.io/environment: {{ .Values.global.environment }}
{{- end }}

{{- define "lateen.selectorLabels" -}}
app.kubernetes.io/name: {{ include "lateen.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "lateen.image" -}}
{{- $registry := .root.Values.global.imageRegistry -}}
{{- $tag := .root.Values.global.imageTag -}}
{{- printf "%s/%s:%s" $registry .name $tag -}}
{{- end }}

{{- define "lateen.serviceAccountName" -}}
{{- printf "%s-sa" (include "lateen.fullname" .) -}}
{{- end }}
