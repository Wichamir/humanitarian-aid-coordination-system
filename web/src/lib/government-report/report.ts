'use server';

import fs from 'fs';
import { cwd } from 'process';
import { createClient } from '../supabase/client';
import { Database } from '@/types/database-generated.types';

type EventRow = Database['public']['Tables']['events']['Row'];
type HelpRequestRow = Database['public']['Tables']['help_requests']['Row'];
type ResourceRequestRow = Database['public']['Tables']['resource_requests']['Row'];


function getReportTemplateFilepath(): string {
  return cwd() + '/templates/' + 'report-template.html';
}

function getReportTemplate(): string {
  let result = '';
  
  result = fs.readFileSync(getReportTemplateFilepath(), 'utf-8');
  
  return result
};

function generateEventTableHtml(events: EventRow[]): string {
  let html = '<table>';

  // Parse table head
  html += `
    <thead>
      <tr>
        <th>Event Title</th>
        <th>Location</th>
        <th>Status</th>
        <th>Description</th>
      </tr>
    </thead>
  `;

  // Parse table body
  html += '<tbody>';
  events.forEach(event => {
    html += `
      <tr>
        <td>${event.title}</td>
        <td>${event.location}</td>
        <td>${event.status}</td>
        <td>${event.description}</td>
      </tr>
    `
  });
  html += '</tbody>';

  html += '</table>';

  return html;
}

function generateHelpRequestTableHtml(helpRequests: HelpRequestRow[]): string {
  let html = '<table>';

  // Parse table head
  html += `
    <thead>
      <tr>
        <th>Request Name</th>
        <th>Event</th>
        <th>Status</th>
        <th>Description</th>
        <th>Created At</th>
      </tr>
    </thead>
  `;

  // Parse table body
  html += '<tbody>';
  helpRequests.forEach(request => {
    html += `
      <tr>
        <td>${request.name}</td>
        <td>${request.event_id}</td> <!-- You might want to join with the event title here -->
        <td>${request.status}</td>
        <td>${request.description || 'N/A'}</td>
        <td>${request.created_at}</td>
      </tr>
    `;
  });
  html += '</tbody>';

  html += '</table>';

  return html;
}

function generateResourceRequestTableHtml(resourceRequests: ResourceRequestRow[]): string {
  let html = '<table>';

  // Parse table head
  html += `
    <thead>
      <tr>
        <th>Request Name</th>
        <th>Event</th>
        <th>Status</th>
        <th>Quantity</th>
        <th>Description</th>
        <th>Created At</th>
      </tr>
    </thead>
  `;

  // Parse table body
  html += '<tbody>';
  resourceRequests.forEach(request => {
    html += `
      <tr>
        <td>${request.name}</td>
        <td>${request.event_id}</td> <!-- Again, you might want to join with event title here -->
        <td>${request.status}</td>
        <td>${request.quantity}</td>
        <td>${request.description || 'N/A'}</td>
        <td>${request.created_at}</td>
      </tr>
    `;
  });
  html += '</tbody>';

  html += '</table>';

  return html;
}

async function fetchEvents(): Promise<EventRow[]> {
  const supabase = createClient();

  const response = await supabase
    .from('events')
    .select('*');
  
  if(response.error) {
    console.error('Error fetching events:', response.error.message);
  }

  return response.data ? response.data : [];
}

async function fetchHelpRequests(): Promise<HelpRequestRow[]> {
  const supabase = createClient();

  const response = await supabase
    .from('help_requests')
    .select('*');
  
  if(response.error) {
    console.error('Error fetching help requests:', response.error.message);
  }

  return response.data ? response.data : [];
}

async function fetchResourceRequests(): Promise<ResourceRequestRow[]> {
  const supabase = createClient();

  const response = await supabase
    .from('resource_requests')
    .select('*');
  
  if(response.error) {
    console.error('Error fetching resource requests:', response.error.message);
  }

  return response.data ? response.data : [];
}

async function fillReportTemplate(template: string): Promise<string> {
  let content = template;

  const date = new Date().toLocaleString();
  content = content.replace(/{{date}}/g, date);

  const events = generateEventTableHtml(await fetchEvents());
  content = content.replace(/{{events}}/g, events);

  const help_requests_arr = await fetchHelpRequests();
  const help_requests = help_requests_arr.length != 0 ? generateHelpRequestTableHtml(help_requests_arr) : '';
  content = content.replace(/{{help_requests}}/g, help_requests);

  const resource_requests_arr = await fetchResourceRequests();
  const resource_requests = resource_requests_arr.length != 0 ? generateResourceRequestTableHtml(resource_requests_arr) : '';
  content = content.replace(/{{resource_requests}}/g, resource_requests);

  return content;
}

async function fetchReportSourceById(id: string): Promise<string> {
  const supabase = createClient();

  const response = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

    if(response.error) {
      console.error('Error fetching reports:', response.error.message);
    }

    const source = response.data?.source;
    return source ? source : "";
}

async function addReportToDb(source: string): Promise<string | null> {
  const supabase = createClient();

  const generatedOn = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reports')
    .insert({
      generated_on: generatedOn,
      source: source
    })
    .single();

    if (error) {
      console.error('Error inserting report:', error.message);
      return null;
    }
    
    return data;
}


export default async function fetchReportHTML(id?: string): Promise<string> {
  if(id) {
    return await fetchReportSourceById(id);
  } else {
    const source = await fillReportTemplate(getReportTemplate());
    await addReportToDb(source);
    return source;
  }
}
