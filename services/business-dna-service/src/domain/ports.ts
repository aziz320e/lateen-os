import type { DomainEvent, OrganizationId } from '@lateen-os/business-dna';

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: readonly DomainEvent[]): Promise<void>;
}

export interface AuthContext {
  readonly subject: string;
  readonly organizationId?: OrganizationId;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly bearerToken?: string;
}

export interface AuthProvider {
  authenticate(token: string | undefined): Promise<AuthContext | null>;
}

export interface AuthorizationRequest {
  readonly organizationId: OrganizationId;
  readonly resource: string;
  readonly action: string;
  readonly subject: string;
}

export interface AuthorizationProvider {
  authorize(request: AuthorizationRequest): Promise<boolean>;
}
