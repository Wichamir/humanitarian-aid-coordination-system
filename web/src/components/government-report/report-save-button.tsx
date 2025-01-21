'use client';

import { Button } from '@chakra-ui/react';
import { jsPDF, HTMLWorker } from 'jspdf';
import fetchReportHTML from '@/lib/government-report/report';

export default function ReportSaveButton(props: { id?: string, text: string }): JSX.Element {
    const generateReport = (html: string): [jsPDF, HTMLWorker] => {
      const report = new jsPDF('portrait', 'mm', 'a4');
      return [report, report.html(html)];
    };

    const getReportName = (): string => {
      const dateInfo = new Date();
      const date = dateInfo.toLocaleDateString().replace(/\//g, '-').replace(/ /g, '_');
      const time = dateInfo.toLocaleTimeString().replace(/:/g, '-').replace(/ /g, '_');
      return `govreport_${date}_${time}.pdf`;
    };

    const handleClick = async (): Promise<void> => {
      const html = await fetchReportHTML(props.id);
      const [report, worker] = generateReport(html);
      await worker;
      report.save(getReportName());
    }
  
    return (
      <Button onClick={handleClick}>
        {props.text}
      </Button>
    );
}
