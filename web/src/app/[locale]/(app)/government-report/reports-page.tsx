'use client';

import { Box, Heading, Table } from '@chakra-ui/react';
import '@/components/government-report/report-save-button';
import { Database } from '@/types/database-generated.types';
import ReportSaveButton from '@/components/government-report/report-save-button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

type ReportRow = Database['public']['Tables']['reports']['Row'];


async function fetchReports(): Promise<ReportRow[] | null> {
  const supabase = createClient();
  
  const response = await supabase
    .from('reports')
    .select('*');
  
  if(response.error) {
    console.error('Error fetching reports:', response.error.message);
  }
  
  return response.data;
}


export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getReports = async () => {
      const data = await fetchReports();
      setReports(data);
      setLoading(false);
    };

    getReports();
  });

  if(loading) {
    return (
      <Box p={8}>
        <Heading mb={4}>Reports</Heading>
        <Heading mb={4}>Loading...</Heading>
      </Box>
    );
  }

  if(!reports || reports.length == 0) {
    return (
      <Box p={8}>
        <Heading mb={4}>Reports</Heading>
        <Heading mb={4}>No reports available.</Heading>
        <ReportSaveButton text='Generate new report'/>
      </Box>
    )
  }

  return (
    <Box p={8}>
      <Heading mb={4}>Reports</Heading>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>ID</Table.ColumnHeader>
            <Table.ColumnHeader>Generated On</Table.ColumnHeader>
            <Table.ColumnHeader>Action</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {reports?.map((report) => (
            <Table.Row key={report.id}>
              <Table.Cell>{report.id}</Table.Cell>
              <Table.Cell>{report.generated_on}</Table.Cell>
              <Table.Cell>
                <ReportSaveButton text='Download' id={report.id}/>
              </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table.Root>

      <ReportSaveButton text='Generate new report'/>
    </Box>
  );
}