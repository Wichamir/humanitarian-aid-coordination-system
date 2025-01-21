'use client';

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database-generated.types';
import React, { useState, useEffect } from 'react';
import {
    Button,
    Box,
    Heading,
    Input,
    Text,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
    createListCollection
} from '@chakra-ui/react';

// Mock data for testing
const mockAidOrganizations = [
    { id: 1, name: 'Red Cross', contact: 'contact@redcross.org' },
    { id: 2, name: 'UNICEF', contact: 'contact@unicef.org' },
    { id: 3, name: 'Doctors Without Borders', contact: 'info@msf.org' },
];

// Type definitions
interface AidOrganization {
    id: number;
    name: string;
    contact: string;
}

interface CrisisEvent {
    id: number;
    title: string;
    description: string;
    assignedOrganizations: number[]; // Array of AidOrganization IDs
}

async function fetchEvents(): Promise<CrisisEvent[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('events')
        .select('*'); 

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data as CrisisEvent[];
}

async function updateAssignedOrganizations(eventId: number, assignedOrganizations: number[]) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('events')
            .update({ assignedOrganizations }) 
            .eq('id', eventId); 

        if (error) {
            console.error('Error updating assigned organizations:', error.message);
            return { success: false, error: error.message };
        }

        console.log('Assigned organizations updated successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error during updating assigned organizations:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}



async function insertEvent(event: Database['public']['Tables']['events']['Insert']) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select(); 

        if (error) {
            console.error('Error inserting event:', error.message);
            return { success: false, error: error.message };
        }

        console.log('Event inserted successfully:', data);
        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error:', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

export default function EventsPage() {
    const [crisisEvents, setCrisisEvents] = useState<CrisisEvent[]>([]);
    const [newEvent, setNewEvent] = useState<Pick<CrisisEvent, 'title' | 'description' | 'assignedOrganizations'>>({
        title: '',
        description: '',
        assignedOrganizations: [],
    });

    // fetch events when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            const events = await fetchEvents();
            setCrisisEvents(events);
        };

        fetchData();
    }, []);

    const handleCreateEvent = async () => {
        if (newEvent.title && newEvent.description) {
            const eventToInsert = {
                title: newEvent.title,
                description: newEvent.description,
                location: 'Unknown Location',
            };

            try {
                const result = await insertEvent(eventToInsert);

                if (result.success && result.data) {
                    const insertedEvent = result.data[0]; 

                    setCrisisEvents([
                        ...crisisEvents,
                        {
                            id: Number(insertedEvent.id), 
                            title: insertedEvent.title,
                            description: insertedEvent.description || '',
                            assignedOrganizations: [],
                        },
                    ]);

                    setNewEvent({ title: '', description: '', assignedOrganizations: [] });
                } else {
                    console.error('Failed to create event:', result.error);
                }
            } catch (error) {
                console.error('Unexpected error while creating event:', error);
            }
        } else {
            console.warn('Please provide valid event name and description.');
        }
    };

    const handleAssignOrganization = (eventId: number, organizationId: number) => {
        setCrisisEvents(crisisEvents.map(event =>
            event.id === eventId
                ? {
                    ...event,
                    assignedOrganizations: [
                        ...(event.assignedOrganizations || []), 
                        organizationId
                    ]
                }
                : event
        ));
    };


    const aidOrganizations = createListCollection({
        items: mockAidOrganizations.map((org) => ({
            label: org.name,
            value: String(org.id),
        })),
    });

    return (
        <Box minWidth={500} minHeight={600}>
                {/* Section: Create Crisis Event */}
                <Box>
                    <Heading as='h2'>Create Crisis Event</Heading>
                    <Input
                        type="text"
                        placeholder="Event Title"
                        value={newEvent.title}
                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ display: 'block', marginBottom: '10px' }}
                    />
                    <Input
                        placeholder="Event Description"
                        value={newEvent.description}
                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                        style={{ display: 'block', marginBottom: '10px', width: '100%', height: '80px' }}
                    />
                    <Button onClick={handleCreateEvent}>Create Event</Button>
                </Box>

                {/* Section: Crisis Events */}
                <Box>
                    <Heading as='h2' mb={5} mt={10}>Crisis Events List</Heading>
                    {crisisEvents.length === 0 ? (
                        <Text>No crisis events created yet.</Text>
                    ) : (
                        crisisEvents.map(event => (
                            <Box key={event.id} mb={50}>
                                <Text>{event.title}</Text>
                                <Text>{event.description}</Text>

                                <SelectRoot
                                    collection={aidOrganizations}
                                    onValueChange={(value) => handleAssignOrganization(event.id, Number(value))}
                                >
                                    <SelectLabel>Assign Organization:</SelectLabel>
                                    <SelectTrigger>
                                        <SelectValueText placeholder="Select an organization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {aidOrganizations.items.map((org) => (
                                            <SelectItem key={org.value} item={org}>
                                                {org.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </SelectRoot>
                            </Box>
                        ))
                    )}
                </Box>
        </Box>
    );
}
